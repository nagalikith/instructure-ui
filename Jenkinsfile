pipeline {
  agent { label 'docker' }

  environment {
    CI=true
    GIT_EMAIL="${GIT_EMAIL}"
    GIT_USERNAME="${GIT_USERNAME}"
    GIT_REMOTE_URL="${GIT_REMOTE_URL}"
    GIT_REMOTE_NAME="${GIT_REMOTE_NAME}"
    NODE_VERSION_LOCKED="${NODE_VERSION_LOCKED}"
  }

  stages {
    stage('Test') {
      steps {
        sh './docker/test'
      }
    }
  }
}
