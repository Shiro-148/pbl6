# ---- Build stage ----
FROM gradle:8.7.0-jdk21 AS builder
WORKDIR /home/gradle/src

# Copy backend source into the container
COPY . .

# Build Spring Boot JAR
RUN gradle --no-daemon clean bootJar

# ---- Run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy built jar from the builder stage
COPY --from=builder /home/gradle/src/build/libs/*.jar /app/app.jar

# Expose Spring Boot default port
EXPOSE 8080

# Allow passing JVM options via JAVA_OPTS
ENV JAVA_OPTS=""

# Start the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
