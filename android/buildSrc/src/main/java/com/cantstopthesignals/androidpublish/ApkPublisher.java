package com.cantstopthesignals.androidpublish;

import com.google.api.client.util.Lists;
import com.google.api.services.androidpublisher.model.LocalizedText;
import com.google.api.services.androidpublisher.model.TrackRelease;
import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import com.google.api.client.http.AbstractInputStreamContent;
import com.google.api.client.http.FileContent;
import com.google.common.base.Preconditions;
import com.google.common.base.Strings;
import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.AndroidPublisher.Edits;
import com.google.api.services.androidpublisher.AndroidPublisher.Edits.Apks.Upload;
import com.google.api.services.androidpublisher.AndroidPublisher.Edits.Commit;
import com.google.api.services.androidpublisher.AndroidPublisher.Edits.Insert;
import com.google.api.services.androidpublisher.AndroidPublisher.Edits.Tracks.Update;
import com.google.api.services.androidpublisher.model.Apk;
import com.google.api.services.androidpublisher.model.AppEdit;
import com.google.api.services.androidpublisher.model.Track;

public class ApkPublisher {
    private static final Log log = LogFactory.getLog(ApkPublisher.class);

    private String packageName;
    private String track;
    private File apkFile;
    private File publisherClientSecretsFile;

    public ApkPublisher(String packageName, String track, File apkFile,
            File publisherClientSecretsFile) {
        this.packageName = packageName;
        this.track = track;
        this.apkFile = apkFile;
        this.publisherClientSecretsFile = publisherClientSecretsFile;

        Preconditions.checkArgument(!Strings.isNullOrEmpty(packageName),
                "packageName cannot be null or empty!");
        Preconditions.checkArgument(!Strings.isNullOrEmpty(track),
                "track cannot be null or empty!");
        Preconditions.checkArgument(apkFile != null && apkFile.isFile(),
                "apkFile cannot be null and must exist!");
        Preconditions.checkArgument(publisherClientSecretsFile != null
                && publisherClientSecretsFile.isFile(),
                "publisherClientSecretsFile cannot be null and must exist!");
    }

    public void publish() throws IOException, GeneralSecurityException {
        // Create the API service.
        AndroidPublisher service = AndroidPublisherHelper.init(
                packageName, null, publisherClientSecretsFile, null);
        final Edits edits = service.edits();

        // Create a new edit to make changes to your listing.
        Insert editRequest = edits
                .insert(packageName, null /** no content */);
        AppEdit edit = editRequest.execute();
        final String editId = edit.getId();
        log.info(String.format("Created edit with id: %s", editId));

        final AbstractInputStreamContent apkFileStream =
                new FileContent(AndroidPublisherHelper.MIME_TYPE_APK, apkFile);
        Upload uploadRequest = edits
                .apks()
                .upload(packageName, editId, apkFileStream);
        Apk apk = uploadRequest.execute();
        log.info(String.format("Version code %d has been uploaded",
                apk.getVersionCode()));

        // Assign apk to alpha track.
        List<Long> apkVersionCodes = new ArrayList<>();
        apkVersionCodes.add(Long.valueOf(apk.getVersionCode()));
        Update updateTrackRequest = edits
                .tracks()
                .update(packageName,
                        editId,
                        track,
                        new Track().setReleases(
                                Collections.singletonList(
                                        new TrackRelease()
                                                .setName("My Alpha Release")
                                                .setVersionCodes(apkVersionCodes)
                                                .setStatus("completed")
                                                .setReleaseNotes(Collections.singletonList(
                                                        new LocalizedText()
                                                                .setLanguage("en-US")
                                                                .setText("New alpha release."))))));
        Track updatedTrack = updateTrackRequest.execute();
        log.info(String.format("Track %s has been updated.", updatedTrack.getTrack()));

        // Commit changes for edit.
        Commit commitRequest = edits.commit(packageName, editId);
        AppEdit appEdit = commitRequest.execute();
        log.info(String.format("App edit with id %s has been comitted", appEdit.getId()));
    }
}