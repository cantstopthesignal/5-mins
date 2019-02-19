package com.cantstopthesignals.checksumpaths

import org.gradle.api.DefaultTask
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.TaskAction
import java.security.DigestInputStream
import java.security.MessageDigest

class ChecksumPathsPropertyTask extends DefaultTask {
    private static final String CHECKSUM_PROPERTY_NAME = "checksum"

    public File[] paths

    @OutputFile
    public File outputPropertyFile

    @TaskAction
    void checksumPaths() {
        if (!outputPropertyFile.getParentFile().exists()) {
            outputPropertyFile.getParentFile().mkdirs()
        }

        Properties properties = new Properties()
        properties.put(CHECKSUM_PROPERTY_NAME, getChecksumForPaths(paths))
        properties.store(new FileOutputStream(outputPropertyFile), null)
    }

    private static String getChecksumForPaths(File[] paths) {
        MessageDigest digest = MessageDigest.getInstance("MD5")
        for (File path : paths) {
            addFileToDigest(digest, path)
        }
        return Base64.getEncoder().encodeToString(digest.digest())
    }

    private static void addFileToDigest(MessageDigest digest, File path) {
        if (path.isDirectory()) {
            for (String childFilename : path.list()) {
                addFileToDigest(digest, new File(path, childFilename))
            }
        } else {
            InputStream is = new FileInputStream(path)
            try {
                DigestInputStream dis = new DigestInputStream(is, digest)
                try {
                    byte[] buffer = new byte[1024]
                    while (true) {
                        int numRead = dis.read(buffer)
                        if (numRead <= 0) {
                            break;
                        }
                    }
                } finally {
                    dis.close()
                }
            } finally {
                is.close()
            }
        }
    }
}