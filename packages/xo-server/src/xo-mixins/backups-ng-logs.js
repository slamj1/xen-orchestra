import { forEach } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors'

const isSkippedError = error =>
  error.message === 'no disks found' ||
  noSuchObject.is(error) ||
  error.message === 'no VMs match this pattern' ||
  error.message === 'unhealthy VDI chain'

const getStatus = (
  error,
  status = error === undefined ? 'success' : 'failure'
) => (status === 'failure' && isSkippedError(error) ? 'skipped' : status)

const computeStatusAndSortTasks = (status, tasks) => {
  if (status === 'failure' || tasks === undefined) {
    return status
  }

  for (let i = 0, n = tasks.length; i < n; ++i) {
    const taskStatus = tasks[i].status
    if (taskStatus === 'failure') {
      return taskStatus
    }
    if (taskStatus === 'skipped') {
      status = taskStatus
    }
  }

  tasks.sort(taskTimeComparator)

  return status
}

const taskTimeComparator = ({ start: s1, end: e1 }, { start: s2, end: e2 }) => {
  if (e1 !== undefined) {
    if (e2 !== undefined) {
      // finished tasks are ordered by their end times
      return e1 - e2
    }
    // finished task before unfinished tasks
    return -1
  } else if (e2 === undefined) {
    // unfinished tasks are ordered by their start times
    return s1 - s2
  }
  // unfinished task after finished tasks
  return 1
}

const TASK_HANDLER = {
  'job.start': ({
    consolidated,
    data,
    id,
    runId,
    runningJobs,
    started,
    time,
  }) => {
    if (
      (data.type === 'backup' || data.key === undefined) &&
      (runId === undefined || runId === id)
    ) {
      const { scheduleId, jobId } = data
      consolidated[id] = started[id] = {
        data: data.data,
        id,
        jobId,
        jobName: data.jobName,
        scheduleId,
        start: time,
        status: runningJobs[jobId] === id ? 'pending' : 'interrupted',
      }
    }
  },
  'job.end': ({ data, started, time }) => {
    const { runJobId } = data
    const log = started[runJobId]
    if (log !== undefined) {
      delete started[runJobId]
      log.end = time
      log.status = computeStatusAndSortTasks(
        getStatus((log.result = data.error)),
        log.tasks
      )
    }
  },
  'task.start': ({
    consolidated,
    data,
    id,
    message,
    runningRestores,
    started,
    time,
  }) => {
    const parent = started[data.parentId]
    if (parent !== undefined) {
      ;(parent.tasks || (parent.tasks = [])).push(
        (started[id] = {
          data: data.data,
          id,
          message,
          start: time,
          status: parent.status,
        })
      )
    } else if (message === 'restore') {
      consolidated[id] = started[id] = {
        data: data.data,
        id,
        message,
        start: time,
        status: runningRestores.has(id) ? 'pending' : 'interrupted',
      }
    }
  },
  'task.end': ({ data, started, time }) => {
    const { taskId } = data
    const log = started[taskId]
    if (log !== undefined) {
      // TODO: merge/transfer work-around
      delete started[taskId]
      log.end = time
      log.status = computeStatusAndSortTasks(
        getStatus((log.result = data.result), data.status),
        log.tasks
      )
    }
  },
  'jobCall.start': ({ data, id, started, time }) => {
    const parent = started[data.runJobId]
    if (parent !== undefined) {
      ;(parent.tasks || (parent.tasks = [])).push(
        (started[id] = {
          data: {
            type: 'VM',
            id: data.params.id,
          },
          id,
          start: time,
          status: parent.status,
        })
      )
    }
  },
  'jobCall.end': ({ data, started, time }) => {
    const { runCallId } = data
    const log = started[runCallId]
    if (log !== undefined) {
      delete started[runCallId]
      log.end = time
      log.status = computeStatusAndSortTasks(
        getStatus((log.result = data.error)),
        log.tasks
      )
    }
  },
}

export default {
  async getBackupNgLogs (runId?: string) {
    const { runningJobs, runningRestores } = this
    const consolidated = {}
    const started = {}
    const [jobLogs, restoreLogs] = await Promise.all([
      this.getLogs('jobs'),
      this.getLogs('restore'),
    ])

    forEach(restoreLogs, ({ data, time, message }, id) =>
      TASK_HANDLER[data.event]({
        consolidated,
        data,
        id,
        message,
        runningRestores,
        started,
        time,
      })
    )

    forEach(jobLogs, ({ data, time, message }, id) =>
      TASK_HANDLER[data.event]({
        consolidated,
        data,
        id,
        message,
        runId,
        runningJobs,
        started,
        time,
      })
    )
    return runId === undefined ? consolidated : consolidated[runId]
  },
}
