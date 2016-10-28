#!/bin/sh

/Applications/Eclipse//plugins/com.google.appengine.eclipse.sdkbundle_1.9.30/appengine-java-sdk-1.9.30/bin/dev_appserver.sh --port=8888 war/ #  --addDebugWarSymlink debug/lib=$PWD/lib/ --addDebugWarSymlink debug/src=$PWD/src/ --port=8888 war/



# CLASSPATH=war/WEB-INF/classes/:war/WEB-INF/lib/appengine-api-1.0-sdk-1.9.30.jar java -javaagent:/Applications/Eclipse/plugins/com.google.appengine.eclipse.sdkbundle_1.9.30/appengine-java-sdk-1.9.30/lib/agent/appengine-agent.jar -Xmx512m -XstartOnFirstThread -Xbootclasspath/p:/Applications/Eclipse/plugins/com.google.appengine.eclipse.sdkbundle_1.6.4.v201203300216r37/appengine-java-sdk-1.6.4/lib/override/appengine-dev-jdk-overrides.jar com.cantstopthesignals.development.DevAppServerWrapperMain --addDebugWarSymlink debug/lib=$PWD/lib/ --addDebugWarSymlink debug/src=$PWD/src/ -- --port=8888 war/
