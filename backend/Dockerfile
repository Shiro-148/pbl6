FROM gradle:8.7.0-jdk21 AS builder
WORKDIR /home/gradle/src

COPY . .

RUN gradle --no-daemon clean bootJar

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /home/gradle/src/build/libs/*.jar /app/app.jar

EXPOSE 8080

ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
