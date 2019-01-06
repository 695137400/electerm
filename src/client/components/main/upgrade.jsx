import React from 'react'
import {Icon, Button} from 'antd'
import _ from 'lodash'
import {getLatestReleaseInfo} from '../../common/update-check'
import upgrade from '../../common/upgrade'
import compare from '../../common/version-compare'
import Link from '../common/external-link'
import {isMac, isWin} from '../../common/constants'
import newTerm from '../../common/new-terminal'

const {getGlobal, prefix} = window
let {
  homepage
} = getGlobal('packInfo')
const e = prefix('updater')
const c = prefix('common')
const installSrc = getGlobal('installSrc')

export default class Upgrade extends React.Component {

  componentDidMount() {
    this.getLatestReleaseInfo()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.shouldCheckUpdate !== this.props.shouldCheckUpdate) {
      this.getLatestReleaseInfo()
    }
  }

  changeProps = (update) => {
    this.props.modifier(old => {
      return {
        upgradeInfo: {
          ...old.upgradeInfo,
          ...update
        }
      }
    })
  }

  minimize = () => {
    this.changeProps({
      showUpgradeModal: true
    })
  }

  close = () => {
    this.props.modifier({
      upgradeInfo: {}
    })
  }

  upgrade = async () => {
    if (!isMac || !isWin) {
      return this.props.addTab(
        {
          ...newTerm(),
          loginScript: 'npm i -g electerm'
        }
      )
    }
    this.changeProps({
      upgrading: true
    })
    let {
      version
    } = this.props.upgradeInfo
    await upgrade({
      version,
      ..._.pick(this, [
        'onData',
        'onEnd',
        'onError'
      ])
    })
    this.props.modifier({
      upgrading: false
    })
  }

  onData = (upgradePercent) => {
    this.props.modifier(old => {
      return {
        ...old.upgradeInfo,
        upgradePercent
      }
    })
  }

  onError = (e) => {
    this.props.modifier(old => {
      return {
        ...old.upgradeInfo,
        error: e.message
      }
    })
  }

  getLatestReleaseInfo = async () => {
    this.changeProps({
      checkingRemoteVersion: true,
      error: ''
    })
    let releaseInfo = await getLatestReleaseInfo()
    this.changeProps({
      checkingRemoteVersion: true
    })
    if (!releaseInfo) {
      return this.changeProps({
        error: 'Can not get version info'
      })
    }
    let currentVer = 'v' + window.et.version.split('-')[0]
    let latestVer = releaseInfo.tag_name
    let shouldUpgrade = compare(currentVer, latestVer) < 0
    let canAutoUpgrade = installSrc || isWin || isMac
    this.changeProps({
      shouldUpgrade,
      version: latestVer,
      canAutoUpgrade,
      showUpgradeModal: true
    })
  }

  renderError = (err) => {
    return (
      <div className="upgrade-panel">
        <Icon
          type="close"
          className="pointer font16 close-upgrade-panel"
          onClick={this.close}
        />
        <p className="pd1b bold">
          {e('fail')}: {err}
        </p>
        <p className="pd1b">
          You can visit
          <Link
            to={homepage}
            className="mg1x"
          >{homepage}</Link> to download new version.
        </p>
      </div>
    )
  }

  renderCanNotUpgrade = () => {
    return (
      <div className="upgrade-panel">
        <Icon
          type="close"
          className="pointer font16 close-upgrade-panel"
          onClick={this.close}
        />
        <p className="pd1b bold">
          {e('noNeed')}
        </p>
        <p className="pd1b">
          {e('noNeedDesc')}
        </p>
      </div>
    )
  }

  render() {
    let {
      remoteVersion,
      upgrading,
      checkingRemoteVersion,
      showUpgradeModal,
      upgradePercent,
      canAutoUpgrade,
      shouldUpgrade,
      error
    } = this.props.upgradeInfo
    if (error) {
      return this.renderError(error)
    }
    if (shouldUpgrade && !canAutoUpgrade) {
      return this.renderCanNotUpgrade()
    }
    let cls = `animate upgrade-panel${showUpgradeModal ? '' : ' upgrade-panel-hide'}`
    let type = upgrading ? 'danger' : 'primary'
    let func = upgrading
      ? this.cancel
      : this.upgrade
    return (
      <div className={cls}>
        <Icon
          type="minus-square"
          className="pointer font16 close-upgrade-panel"
          onClick={this.minimize}
        />
        <p className="pd1b">
          {e('newVersion')} <b>{remoteVersion}</b>
        </p>
        <p className="pd1b">
          <Button
            type={type}
            icon="up-circle"
            loading={checkingRemoteVersion}
            disabled={checkingRemoteVersion}
            onClick={func}
          >
            {
              upgrading
                ? <span>{`${upgradePercent}% ${c('cancel')}`}</span>
                : e('upgrade')
            }
          </Button>
        </p>
      </div>
    )
  }

}