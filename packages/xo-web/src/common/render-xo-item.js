import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { get } from '@xen-orchestra/defined'
import { find, startsWith } from 'lodash'

import Icon from './icon'
import Link from './link'
import { addSubscriptions, connectStore, formatSize } from './utils'
import { createGetObject, createSelector } from './selectors'
import { FormattedDate } from 'react-intl'
import { isSrWritable, subscribeRemotes } from './xo'

// ===================================================================

const UNKNOWN_ITEM = <span className='text-muted'>{_('errorUnknownItem')}</span>

const LinkWrapper = ({ children, link, to, newTab }) =>
  link ? (
    <Link to={to} target={newTab && '_blank'}>
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  )

LinkWrapper.propTypes = {
  link: PropTypes.bool,
  newTab: PropTypes.bool,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
}

// ===================================================================

export const Pool = [
  connectStore(() => ({
    pool: createGetObject(),
  })),
  ({ pool, link, newTab }) => {
    if (pool === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/pools/${pool.id}`}>
        <Icon icon='pool' /> {pool.name_label}
      </LinkWrapper>
    )
  },
].reduceRight((value, decorator) => decorator(value))

Pool.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Pool.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Host = [
  connectStore(() => {
    const getHost = createGetObject()
    return {
      host: getHost,
      pool: createGetObject(createSelector(getHost, host => host.$pool)),
    }
  }),
  ({ host, pool, link, newTab }) => {
    if (host === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/hosts/${host.id}`}>
        <Icon icon='host' /> {host.name_label}
        {pool !== undefined && ` (${pool.name_label})`}
      </LinkWrapper>
    )
  },
].reduceRight((value, decorator) => decorator(value))

Host.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Host.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Vm = [
  connectStore(() => {
    const getVm = createGetObject()
    return {
      vm: getVm,
      container: createGetObject(
        createSelector(getVm, vm => get(() => vm.$container))
      ),
    }
  }),
  ({ vm, container, link, newTab }) => {
    if (vm === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/vms/${vm.id}`}>
        <Icon icon={`vm-${vm.power_state.toLowerCase()}`} /> {vm.name_label}
        {container !== undefined && ` (${container.name_label})`}
      </LinkWrapper>
    )
  },
].reduceRight((value, decorator) => decorator(value))

Vm.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Vm.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const VmTemplate = [
  connectStore(() => ({
    template: createGetObject(),
  })),
  ({ template }) => {
    if (template === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <span>
        <Icon icon='vm' /> {template.name_label}
      </span>
    )
  },
].reduceRight((value, decorator) => decorator(value))

VmTemplate.propTypes = {
  id: PropTypes.string.isRequired,
}

VmTemplate.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Sr = [
  connectStore(() => {
    const getSr = createGetObject()
    const getContainer = createGetObject(
      createSelector(getSr, sr => get(() => sr.$container))
    )
    return (state, props) => ({
      // FIXME: props.self ugly workaround to get object as a self user
      sr: getSr(state, props, props.self),
      container: getContainer(state, props),
    })
  }),
  ({ sr, container, link, newTab }) => {
    if (sr === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to={`/srs/${sr.id}`}>
        <Icon icon='sr' /> {sr.name_label}
        {container !== undefined && (
          <span className='text-muted'> - {container.name_label}</span>
        )}
        {isSrWritable(sr) && (
          <span>{` (${formatSize(sr.size - sr.physical_usage)} free)`}</span>
        )}
      </LinkWrapper>
    )
  },
].reduceRight((value, decorator) => decorator(value))

Sr.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Sr.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Vdi = [
  connectStore(() => ({
    vdi: createGetObject(),
  })),
  ({ vdi }) => {
    if (vdi === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <span>
        <Icon icon='disk' /> {vdi.name_label}
        {vdi.name_description && <span> ({vdi.name_description})</span>}
      </span>
    )
  },
].reduceRight((value, decorator) => decorator(value))

Vdi.propTypes = {
  id: PropTypes.string.isRequired,
}

// ===================================================================

export const Network = [
  connectStore(() => ({
    network: createGetObject(),
  })),
  ({ network }) => {
    if (network === undefined) {
      return UNKNOWN_ITEM
    }

    return (
      <span>
        <Icon icon='network' /> {network.name_label}
      </span>
    )
  },
].reduceRight((value, decorator) => decorator(value))

Network.propTypes = {
  id: PropTypes.string.isRequired,
}

// ===================================================================

export const Remote = [
  addSubscriptions(({ id }) => ({
    remote: cb => subscribeRemotes(remotes => cb(find(remotes, { id }))),
  })),
  ({ remote, link, newTab }) => {
    if (remote === undefined) {
      return UNKNOWN_ITEM // TODO: handle remotes not fetched yet
    }

    return (
      <LinkWrapper link={link} newTab={newTab} to='/settings/remotes'>
        <Icon icon='remote' /> {remote.name}
      </LinkWrapper>
    )
  },
].reduceRight((value, decorator) => decorator(value))

Remote.propTypes = {
  id: PropTypes.string.isRequired,
  link: PropTypes.bool,
  newTab: PropTypes.bool,
}

Remote.defaultProps = {
  link: false,
  newTab: false,
}

// ===================================================================

export const Vgpu = connectStore(() => ({
  vgpuType: createGetObject((_, props) => props.vgpu.vgpuType),
}))(({ vgpu, vgpuType }) => (
  <span>
    <Icon icon='vgpu' /> {vgpuType.modelName}
  </span>
))

Vgpu.propTypes = {
  vgpu: PropTypes.object.isRequired,
}

// ===================================================================

const xoItemToRender = {
  // Subscription objects.
  cloudConfig: template => (
    <span>
      <Icon icon='template' /> {template.name}
    </span>
  ),
  group: group => (
    <span>
      <Icon icon='group' /> {group.name}
    </span>
  ),
  remote: ({ value: { id } }) => <Remote id={id} />,
  role: role => <span>{role.name}</span>,
  user: user => (
    <span>
      <Icon icon='user' /> {user.email}
    </span>
  ),
  resourceSet: resourceSet => (
    <span>
      <strong>
        <Icon icon='resource-set' /> {resourceSet.name}
      </strong>{' '}
      ({resourceSet.id})
    </span>
  ),
  sshKey: key => (
    <span>
      <Icon icon='ssh-key' /> {key.label}
    </span>
  ),
  ipPool: ipPool => (
    <span>
      <Icon icon='ip' /> {ipPool.name}
    </span>
  ),
  ipAddress: ({ label, used }) => {
    if (used) {
      return <strong className='text-warning'>{label}</strong>
    }
    return <span>{label}</span>
  },

  // XO objects.
  pool: ({ id }) => <Pool id={id} />,

  VDI: ({ id }) => <Vdi id={id} />,

  // Pool objects.
  'VM-template': ({ id }) => <VmTemplate id={id} />,
  host: ({ id }) => <Host id={id} />,
  network: ({ id }) => <Pool id={id} />,

  // SR.
  SR: ({ id }) => <Sr id={id} />,
  'SR-resourceSet': ({ id }) => <Sr id={id} self />,

  // VM.
  VM: ({ id }) => <Vm id={id} />,
  'VM-snapshot': ({ id }) => <Vm id={id} />,
  'VM-controller': ({ id }) => (
    <span>
      <Icon icon='host' /> <Vm id={id} />
    </span>
  ),

  // PIF.
  PIF: pif => (
    <span>
      <Icon
        icon='network'
        color={pif.carrier ? 'text-success' : 'text-danger'}
      />{' '}
      {pif.device} ({pif.deviceName})
    </span>
  ),

  // Tags.
  tag: tag => (
    <span>
      <Icon icon='tag' /> {tag.value}
    </span>
  ),

  // GPUs

  vgpu: vgpu => <Vgpu vgpu={vgpu} />,

  vgpuType: type => (
    <span>
      <Icon icon='gpu' /> {type.modelName} ({type.vendorName}){' '}
      {type.maxResolutionX}x{type.maxResolutionY}
    </span>
  ),

  gpuGroup: group => (
    <span>
      {startsWith(group.name_label, 'Group of ')
        ? group.name_label.slice(9)
        : group.name_label}
    </span>
  ),

  backup: backup => (
    <span>
      <span className='tag tag-info' style={{ textTransform: 'capitalize' }}>
        {backup.mode}
      </span>{' '}
      <span className='tag tag-warning'>{backup.remote.name}</span>{' '}
      <FormattedDate
        value={new Date(backup.timestamp)}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    </span>
  ),
}

const renderXoItem = (item, { className, type: xoType } = {}) => {
  const { id, label } = item
  const type = xoType || item.type

  if (item.removed) {
    return (
      <span key={id} className='text-danger'>
        {' '}
        <Icon icon='alarm' /> {id}
      </span>
    )
  }

  if (!type) {
    if (process.env.NODE_ENV !== 'production' && !label) {
      throw new Error(`an item must have at least either a type or a label`)
    }
    return (
      <span key={id} className={className}>
        {label}
      </span>
    )
  }

  const Component = xoItemToRender[type]

  if (process.env.NODE_ENV !== 'production' && !Component) {
    throw new Error(`no available component for type ${type}`)
  }

  if (Component) {
    return (
      <span key={id} className={className}>
        <Component {...item} />
      </span>
    )
  }
}

export { renderXoItem as default }

export const getRenderXoItemOfType = type => (item, options = {}) =>
  renderXoItem(item, { ...options, type })

const GenericXoItem = connectStore(() => {
  const getObject = createGetObject()

  return (state, props) => ({
    xoItem: getObject(state, props),
  })
})(
  ({ xoItem, ...props }) =>
    xoItem ? renderXoItem(xoItem, props) : renderXoUnknownItem()
)

export const renderXoItemFromId = (id, props) => (
  <GenericXoItem {...props} id={id} />
)

export const renderXoUnknownItem = () => (
  <span className='text-muted'>{_('errorNoSuchItem')}</span>
)
