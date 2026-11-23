
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment') {
            steps {
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('Tests') {
            steps {
                sh 'npm test'
            }
        }
    }

    post {
        success {
            echo 'GolazoBet CI: Pipeline completado correctamente.'
        }
        failure {
            echo 'GolazoBet CI: La ejecución presentó errores.'
        }
    }
}
