docker.image('spacifici/fennec:66.0.3').inside() {
    stage('Build') {
        sh   """pwd;
                ls -la;
                ./mach build;
                ./mach package
             """
    }
}
