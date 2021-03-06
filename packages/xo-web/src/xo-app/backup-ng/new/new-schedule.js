import _ from 'intl'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import { Card, CardBlock } from 'card'
import { generateRandomId } from 'utils'
import { injectState, provideState } from 'reaclette'
import { Number } from 'form'

import { FormGroup, Input } from './../utils'

export default [
  provideState({
    initialState: () => ({
      formId: generateRandomId(),
      idInputName: generateRandomId(),
    }),
    effects: {
      setSchedule: (_, params) => (_, { value, onChange }) => {
        onChange({
          ...value,
          ...params,
        })
      },
      setExportRetention: ({ setSchedule }, exportRetention) => () => {
        setSchedule({
          exportRetention,
        })
      },
      setCopyRetention: ({ setSchedule }, copyRetention) => () => {
        setSchedule({
          copyRetention,
        })
      },
      setSnapshotRetention: ({ setSchedule }, snapshotRetention) => () => {
        setSchedule({
          snapshotRetention,
        })
      },
      setCronTimezone: (
        { setSchedule },
        { cronPattern: cron, timezone }
      ) => () => {
        setSchedule({
          cron,
          timezone,
        })
      },
      setName: ({ setSchedule }, { target: { value } }) => () => {
        setSchedule({
          name: value.trim() === '' ? null : value,
        })
      },
    },
  }),
  injectState,
  ({ effects, state, modes, value: schedule }) => (
    <Card>
      <CardBlock>
        <FormGroup>
          <label htmlFor={state.idInputName}>
            <strong>{_('formName')}</strong>
          </label>
          <Input
            id={state.idInputName}
            onChange={effects.setName}
            value={schedule.name}
          />
        </FormGroup>
        {modes.exportMode && (
          <FormGroup>
            <label>
              <strong>{_('scheduleExportRetention')}</strong>
            </label>
            <Number
              min='0'
              onChange={effects.setExportRetention}
              value={schedule.exportRetention}
            />
          </FormGroup>
        )}
        {modes.copyMode && (
          <FormGroup>
            <label>
              <strong>{_('scheduleCopyRetention')}</strong>
            </label>
            <Number
              min='0'
              onChange={effects.setCopyRetention}
              value={schedule.copyRetention}
            />
          </FormGroup>
        )}
        {modes.snapshotMode && (
          <FormGroup>
            <label>
              <strong>{_('snapshotRetention')}</strong>
            </label>
            <Number
              min='0'
              onChange={effects.setSnapshotRetention}
              value={schedule.snapshotRetention}
            />
          </FormGroup>
        )}
        <Scheduler
          onChange={effects.setCronTimezone}
          cronPattern={schedule.cron}
          timezone={schedule.timezone}
        />
        <SchedulePreview
          cronPattern={schedule.cron}
          timezone={schedule.timezone}
        />
      </CardBlock>
    </Card>
  ),
].reduceRight((value, decorator) => decorator(value))
