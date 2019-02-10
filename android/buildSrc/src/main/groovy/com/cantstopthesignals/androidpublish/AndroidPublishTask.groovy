package com.cantstopthesignals.androidpublish;

import org.gradle.api.DefaultTask;
import org.gradle.api.tasks.TaskAction;

class AndroidPublishTask extends DefaultTask {
    File apkFile
    String packageName
    String track
    File publisherClientSecretsFile

    @TaskAction
    void publishApk() {
        ApkPublisher publisher = new ApkPublisher(packageName, track, apkFile,
                publisherClientSecretsFile);
        publisher.publish();
    }
}