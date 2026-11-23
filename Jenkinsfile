
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
                sh 'docker version'
            }
        }

        stage('Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t golazobet:latest .'
            }
        }
    }

    post {
        success {
            echo 'GolazoBet CI: pruebas y construcción Docker completadas correctamente.'
        }
        failure {
            echo 'GolazoBet CI: la ejecución presentó errores.'
        }
    }
}

