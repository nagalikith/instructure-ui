/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - present Instructure, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const fs = require('fs')
const path = require('path')
const rl = require('readline')

const { runCommandAsync } = require('./command')
const { getPackageJSON } = require('./get-package')
const {
  getIssuesInRelease,
  createJiraVersion,
  updateJiraIssues,
  getIssuesInCommit
} = require('./jira')
const {
  postStableReleaseSlackMessage,
  postReleaseCandidateSlackMessage
} = require('./slack')
const {
  setupGit,
  checkWorkingDirectory,
  checkIfGitTagExists,
  checkIfCommitIsReviewed,
  isReleaseCommit,
  createGitTagForRelease
} = require('./git')
const { error, info } = require('./logger')
const { publishGithubPages } = require('./gh-pages')

async function checkPackagePublished (packageName, currentVersion) {
  const result = runCommandAsync(`npm info ${packageName}@${currentVersion} version`)
  if (result === currentVersion) {
    error(`${packageName}@${currentVersion} is already published!`)
    process.exit(1)
  }
}

async function createNPMRCFile (config = {}) {
  const {
   NPM_TOKEN,
   NPM_EMAIL,
   NPM_USERNAME
  } = process.env

  fs.writeFileSync(
    path.resolve(process.cwd(), '.npmrc'),
    `//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n${config.npm_scope}\nemail=${NPM_EMAIL}\nname=${NPM_USERNAME}`
  )

  await runCommandAsync('npm whoami')
}

const getReleaseVersion = async function getReleaseVersion (currentVersion) {
  let releaseVersion = currentVersion

  await checkWorkingDirectory()

  if (await isReleaseCommit(releaseVersion)) {
    await checkIfGitTagExists(releaseVersion)
    await checkIfCommitIsReviewed()
  } else {
    const commit = await runCommandAsync(`git rev-parse --short HEAD`)
    const description = await runCommandAsync(`git describe --match "v[0-9]*" --first-parent`)
    const index = await runCommandAsync(`echo ${description}| cut -d'-' -f 2`)
    await runCommandAsync('$(npm bin)/standard-version')
    const nextVersion = getPackageJSON().version
    await runCommandAsync(`git reset --hard ${commit}`)
    releaseVersion = `${nextVersion}-rc.${index}`
  }

  info(releaseVersion)
  return releaseVersion
}
exports.getReleaseVersion = getReleaseVersion

const publish = async function publish (packageName, currentVersion, releaseVersion, config = {}) {
  await setupGit()
  await createNPMRCFile(config)

  const releaseCommit = await isReleaseCommit(releaseVersion)
  const npmTag = (currentVersion === releaseVersion) ? 'latest' : 'rc'
  const args = [
    '--yes',
    '--skip-git',
    '--force-publish=*',
    `--repo-version ${releaseVersion}`,
    `--npm-tag ${npmTag}`
  ]

  await checkWorkingDirectory()

  if (currentVersion === releaseVersion) {
    if (releaseCommit) {
      checkIfCommitIsReviewed()
    } else {
      error('Latest release should be run from a merged version bump commit!')
      process.exit(1)
    }
  }

  info(`📦  Publishing ${npmTag} ${releaseVersion} of ${packageName}...`)

  try {
    await runCommandAsync(`$(npm bin)/lerna publish ${args.join(' ')}`)
  } catch (err) {
    error(err)
    process.exit(1)
  }

  info(`📦  Version ${npmTag} ${releaseVersion} of ${packageName} was successfully published!`)
}
exports.publish = publish

const postPublish = async function postPublish (packageName, releaseVersion, config = {}) {
  if (await isReleaseCommit(releaseVersion)) {
    info(`Running post-publish steps for ${releaseVersion} of ${packageName}...`)
    await checkIfCommitIsReviewed()
    await createGitTagForRelease(releaseVersion)

    try {
      await publishGithubPages(config)
    } catch (err) {
      error(err)
      process.exit(1)
    }

    const issueKeys = await getIssuesInRelease(config)
    const jiraVersion = await createJiraVersion(packageName, releaseVersion, config)
    await updateJiraIssues(issueKeys, jiraVersion.name, config)

    postStableReleaseSlackMessage(jiraVersion, issueKeys, config)
  } else {
    const issueKeys = await getIssuesInCommit(config)
    postReleaseCandidateSlackMessage(packageName, releaseVersion, issueKeys, config)
  }
}
exports.postPublish = postPublish

exports.publishPackage = async function publishPackage (packageName, currentVersion, releaseVersion, config = {}) {
  await setupGit()
  await createNPMRCFile(config)

  const releaseCommit = await isReleaseCommit(releaseVersion)
  const npmTag = (currentVersion === releaseVersion) ? 'latest' : 'rc'

  await checkWorkingDirectory()
  await checkPackagePublished(packageName, releaseVersion)

  if (currentVersion === releaseVersion) {
    if (releaseCommit) {
      checkIfCommitIsReviewed()
    } else {
      error('Latest release should be run from a merged version bump commit!')
      process.exit(1)
    }
  }

  info(`📦  Publishing ${npmTag} ${releaseVersion} of ${packageName}...`)
  await runCommandAsync(`$(npm bin)/yarn publish --tag ${npmTag}`)
  info(`📦  Version ${releaseVersion} of ${packageName} was successfully published!`)
}

exports.deprecatePackage = async function deprecatePackage (packageName, currentVersion, message, config = {}) {
  await createNPMRCFile(config)
  const pkg = `${packageName}@${currentVersion}`

  info(`📦  Deprecating ${pkg}...`)
  await runCommandAsync(`npm deprecate ${pkg} ${message}`)
}

exports.bump = async function bump (releaseType, config = {}) {
  await setupGit()
  await checkWorkingDirectory()

  const versionArgs = releaseType ? `--release-as ${releaseType}` : ''
  await runCommandAsync(`$(npm bin)/standard-version ${versionArgs}`)

  const { name, version } = getPackageJSON()

  info(`📦  Updating ${name} packages and generating the changelog for ${version}...`)

  const args = [
    '--yes',
    '--skip-git',
    '--skip-npm',
    '--force-publish=*',
    '--conventional-commits',
    `--repo-version ${version}`
  ]

  try {
    await runCommandAsync(`$(npm bin)/lerna publish ${args.join(' ')}`)
  } catch (err) {
    error(err)
    process.exit(1)
  }

  info(`💾  Committing version bump commit for ${name} ${version}...`)

  await runCommandAsync(`git commit -a -m "chore(release): ${version}"`)
}

exports.release = async function release (packageName, currentVersion, releaseVersion, config = {}) {
  await setupGit()

  let versionToRelease = releaseVersion

  if (!versionToRelease) {
    info(`Determining release version for ${packageName}...`)
    versionToRelease = await getReleaseVersion(currentVersion)
  }

  info(`Publishing version ${versionToRelease} of ${packageName}...`)

  if (!process.env.CI) {
    const confirm = rl.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    confirm.question('Continue? [y/n]\n', function (reply) {
      confirm.close()
      if (!['Y', 'y'].includes(reply.trim())) {
        process.exit(0)
      }
    })
  }

  await publish(packageName, currentVersion, versionToRelease, config)

  await postPublish(packageName, versionToRelease, config)

  info(`Version ${versionToRelease} of ${packageName} was successfully released!`)
}