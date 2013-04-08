package com.cantstopthesignals.development;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.Callable;
import com.google.appengine.tools.development.DevAppServer;
import com.google.appengine.tools.development.DevAppServerMain;

/**
 * Wrap the App Engine DevAppServer to use a development friendly war
 */
public class DevAppServerWrapperMain {
  private static final int SERVER_START_TIMEOUT = 10000;

  private Map<String, String> debugWarSymlinks = new TreeMap<String, String>();
  private final File debugWarDir;
  private String address = DevAppServer.DEFAULT_HTTP_ADDRESS;
  private int port = DevAppServer.DEFAULT_HTTP_PORT;

  public DevAppServerWrapperMain(String[] args) throws Exception {
    String[] devAppArgs = parseArgs(args);

    File warDir = new File(args[args.length - 1]).getCanonicalFile();
    DevAppServerMain.validateWarPath(warDir);

    debugWarDir = createDevelopmentWarDirectory(warDir);
    devAppArgs[devAppArgs.length - 1] = debugWarDir.getPath();

    waitForPort(InetAddress.getByName(address), port, SERVER_START_TIMEOUT,
        new Callable<Void>() {
      @Override
      public Void call() throws IOException {
        installDebugWarSymlinks();
        return null;
      }
    });

    DevAppServerMain.main(devAppArgs);
  }

  /**
   * After the development server has started, install debug symlinks
   */
  private void installDebugWarSymlinks() throws IOException {
    for (Map.Entry<String, String> entry : debugWarSymlinks.entrySet()) {
      File srcFileRelative = new File(entry.getKey());
      if (srcFileRelative.isAbsolute()) {
        System.err.println("Error: debugWarSymlink from path should be relative: "
            + srcFileRelative.toString());
      }
      File srcFile = new File(debugWarDir.getAbsolutePath() + File.separator
          + entry.getKey());
      if (srcFile.getParent() != null) {
        srcFile.getParentFile().mkdirs();
      }
      symLink(srcFile.getPath(), entry.getValue());
    }
  }

  /**
   * Create a temporary war directory that has symlinks to all files in the
   * main war directory.
   */
  private File createDevelopmentWarDirectory(File warDir) throws IOException {
    File tempFile = File.createTempFile("tmpWar",
        Long.toString(System.nanoTime()));
    if (!(tempFile.delete())) {
      throw new IOException("Could not delete temp file: " 
          + tempFile.getAbsolutePath());
    }
    if (!(tempFile.mkdir())) {
      throw new IOException("Could not create temp directory: "
          + tempFile.getAbsolutePath());
    }
    File tempDir = tempFile;
    for (File warFile : warDir.listFiles()) {
      String srcName = warFile.getName();
      String srcPath = tempDir.getAbsolutePath() + File.separator + srcName;
      String destPath = warFile.getAbsolutePath();
      symLink(srcPath, destPath);
    }
    return tempDir;
  }

  /**
   * Wait for a port to be in listening state, then run the closure provided.
   */
  private void waitForPort(final InetAddress address, final int port,
      final long timeout, final Callable<Void> runOnceAvailable) {
    Thread watcherThread = new Thread() {
      public void run() {
        long startTime = System.currentTimeMillis();
        while (true) {
          long now = System.currentTimeMillis();
          if (now > startTime + timeout || now < startTime) {
            System.err.println("Error: Timeout waiting for server to start");
            System.exit(1);
          }
          try {
            Socket socket = new Socket(address, port);
            socket.close();
            break;
          } catch (IOException e) {
          }
          try {
            Thread.sleep(100);
          } catch (InterruptedException e) {
          }
        }
        try {
          runOnceAvailable.call();
        } catch (Exception e) {
          throw new RuntimeException(e);
        }
      }
    };
    watcherThread.setDaemon(true);
    watcherThread.start();
  }

  /**
   * Create a symlink.
   */
  private void symLink(String srcPath, String destPath) throws IOException {
    Process subProcess = Runtime.getRuntime().exec(
        new String[] {"/bin/ln", "-s", destPath, srcPath});
    while (true) {
      try {
        if (subProcess.waitFor() != 0) {
          throw new IOException("Failed to create symlink from " + srcPath
              + " to " + destPath);
        }
        break;
      } catch (InterruptedException e) {}
    }
  }

  private void usage() {
    System.out.println("Usage: DevAppServerWrapperMain [wrapper-args] -- "
        + "[dev-app-server-args]");
    System.out.println("    wrapper-args:");
    System.out.println("      --addDebugWarSymlink=<from>=<to> ...");
    System.exit(1);
  }

  private String[] parseArgs(String[] args) throws IOException {
    boolean remainingAreDevAppArgs = false;
    List<String> devAppArgs = new LinkedList<String>();

    int argIndex = 0;
    while (argIndex < args.length) {
      String arg = args[argIndex++];
      if (remainingAreDevAppArgs) {
        if (arg.equals("-p")) {
          port = Integer.valueOf(args[argIndex + 1]);
        } else if (arg.startsWith("--port=")) {
          port = Integer.valueOf(arg.split("=")[1]);
        }
        devAppArgs.add(arg);
      } else if (arg.equals("--")) {
        remainingAreDevAppArgs = true;
      } else if (arg.equals("--addDebugWarSymlink")) {
        if (argIndex == args.length - 1) {
          usage();
        }
        String[] valuePieces = args[argIndex++].split("=");
        if (valuePieces.length != 2) {
          usage();
        }
        validateDebugWarSymlink(valuePieces[0], valuePieces[1]);
        debugWarSymlinks.put(valuePieces[0], valuePieces[1]);
      } else {
        usage();
      }
    }
    return devAppArgs.toArray(new String[0]);
  }

  private void validateDebugWarSymlink(String fromPath, String toPath)
      throws IOException {
    File fromFile = new File(fromPath);
    File toFile = new File(toPath);
    if (fromFile.isAbsolute() || fromFile.getPath().startsWith("..")) {
      System.err.println("Error: debugWarSymlink from path should be relative: "
          + fromFile.getPath());
      System.exit(1);
    }
    if (!toFile.isAbsolute() || !toFile.exists()) {
      System.err.println("Error: debugWarSymlink to path should be absolute "
          + "and exist: " + fromPath);
      System.exit(1);
    }
  }

  public static void main(String[] args) throws Exception {
    new DevAppServerWrapperMain(args);
  }
}
