import _ from 'messages'
import Component from 'base-component'
import classNames from 'classnames'
import Icon from 'icon'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import React from 'react'
import Tooltip from 'tooltip'
import { Button } from 'react-bootstrap-4/lib'
import { connectStore, noop } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { signOut } from 'xo'

import styles from './index.css'

@connectStore(() => {
  const getNumberOfTasks = createGetObjectsOfType('task').count(
    [ task => task.status === 'pending' ]
  )
  return (state, props) => ({
    // FIXME: remove when fixed in React.
    //
    // There are currently issues between context updates (used by
    // react-intl) and pure components.
    lang: state.lang,

    nTasks: getNumberOfTasks(state, props),
    user: state.user
  })
}, {
  withRef: true
})
export default class Menu extends Component {
  componentWillMount () {
    const updateCollapsed = () => {
      this.setState({ collapsed: window.innerWidth < 1200 })
    }
    updateCollapsed()

    window.addEventListener('resize', updateCollapsed)
    this._removeListener = () => {
      window.removeEventListener('resize', updateCollapsed)
      this._removeListener = noop
    }
  }

  componentWillUnmount () {
    this._removeListener()
  }

  get height () {
    return this.refs.content.offsetHeight
  }

  _toggleCollapsed = () => {
    this._removeListener()
    this.setState({ collapsed: !this.state.collapsed })
  }

  render () {
    const { nTasks, user } = this.props
    const items = [
      { to: '/home', icon: 'home', label: 'homePage' },
      { to: '/dashboard/overview', icon: 'dashboard', label: 'dashboardPage', subMenu: [
        { to: '/dashboard/overview', icon: 'dashboard-overview', label: 'overviewDashboardPage' },
        { to: '/dashboard/visualization', icon: 'dashboard-visualization', label: 'overviewVisualizationDashboardPage' },
        { to: '/dashboard/stats', icon: 'dashboard-stats', label: 'overviewStatsDashboardPage' },
        { to: '/dashboard/health', icon: 'dashboard-health', label: 'overviewHealthDashboardPage' }
      ]},
      { to: '/self/dashboard', icon: 'self-service', label: 'selfServicePage', subMenu: [
        { to: '/self/dashboard', icon: 'self-service-dashboard', label: 'selfServiceDashboardPage' },
        { to: '/self/admin', icon: 'self-service-admin', label: 'selfServiceAdminPage' }
      ]},
      { to: '/backup/overview', icon: 'backup', label: 'backupPage', subMenu: [
        { to: '/backup/overview', icon: 'backup-overview', label: 'backupOverviewPage' },
        { to: '/backup/new', icon: 'backup-new', label: 'backupNewPage' },
        { to: '/backup/restore', icon: 'backup-restore', label: 'backupRestorePage' }
      ]},
      { to: '/xoa-update', icon: 'update', label: 'updatePage' },
      { to: '/settings/servers', icon: 'settings', label: 'settingsPage', subMenu: [
        { to: '/settings/servers', icon: 'settings-servers', label: 'settingsServersPage' },
        { to: '/settings/users', icon: 'settings-users', label: 'settingsUsersPage' },
        { to: '/settings/groups', icon: 'settings-groups', label: 'settingsGroupsPage' },
        { to: '/settings/acls', icon: 'settings-acls', label: 'settingsAclsPage' },
        { to: '/settings/remotes', icon: 'backup-remotes', label: 'backupRemotesPage' },
        { to: '/settings/plugins', icon: 'settings-plugins', label: 'settingsPluginsPage' }
      ]},
      { to: '/about', icon: 'about', label: 'aboutPage' },
      { to: '/new/vm', icon: 'new', label: 'newMenu', subMenu: [
        { to: '/new/vm', icon: 'new-vm', label: 'newVmPage' },
        { to: '/new/sr', icon: 'new-sr', label: 'newSrPage' },
        { to: '/settings/servers', icon: 'settings-servers', label: 'newServerPage' },
        { to: '/import', icon: 'new-import', label: 'newImport' }
      ]},
      { to: '/tasks', icon: 'tasks', label: 'taskMenu', pill: nTasks }
    ]

    return <div className={classNames(
      'xo-menu',
      this.state.collapsed && styles.collapsed
    )}>
      <ul className='nav nav-sidebar nav-pills nav-stacked' ref='content'>
        <li>
          <span>
            <a className={styles.brand} href='#'>
              <span className={styles.hiddenUncollapsed}>XO</span>
              <span className={styles.hiddenCollapsed}>Xen Orchestra</span>
            </a>
          </span>
        </li>
        <li>
          <Button onClick={this._toggleCollapsed}>
            <Icon icon='menu-collapse' size='lg' fixedWidth />
          </Button>
        </li>
        {map(items, (item, index) =>
          <MenuLinkItem key={index} item={item} />
        )}
        <li>&nbsp;</li>
        <li>&nbsp;</li>
        <li className='nav-item xo-menu-item'>
          <Button className='nav-link' onClick={signOut}>
            <Icon icon='sign-out' size='lg' fixedWidth />
            <span className={styles.hiddenCollapsed}>{' '}{_('signOut')}</span>
          </Button>
        </li>
        <li className='nav-item'>
          <Link className='nav-link' style={{display: 'flex'}} to={'/user'}>
            <div style={{margin: 'auto'}}>
              <Tooltip content={user ? user.email : ''}>
                <Icon icon='user' size='lg' />
              </Tooltip>
            </div>
          </Link>
        </li>
      </ul>
    </div>
  }
}

const MenuLinkItem = props => {
  const { item } = props
  const { to, icon, label, subMenu, pill } = item

  return <li className='nav-item xo-menu-item'>
    <Link activeClassName='active' className={classNames('nav-link', styles.centerCollapsed)} to={to}>
      <Icon className={classNames(pill && styles.hiddenCollapsed)} icon={`menu-${icon}`} size='lg' fixedWidth />
      <span className={styles.hiddenCollapsed}>{' '}{_(label)}&nbsp;</span>
      {pill > 0 && <span className='tag tag-pill tag-primary'>{pill}</span>}
    </Link>
    {subMenu && <SubMenu items={subMenu} />}
  </li>
}

const SubMenu = props => {
  return <ul className='nav nav-pills nav-stacked xo-sub-menu'>
    {map(props.items, (item, index) => (
      <li key={index} className='nav-item xo-menu-item'>
        <Link activeClassName='active' className='nav-link' to={item.to}>
          <Icon icon={`menu-${item.icon}`} size='lg' fixedWidth />
          {' '}
          {_(item.label)}
        </Link>
      </li>
    ))}
  </ul>
}
