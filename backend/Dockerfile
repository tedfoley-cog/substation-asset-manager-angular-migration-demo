FROM maven:3.9.9-eclipse-temurin-17 AS build
# Optional Maven Central mirror (CI runners and some corporate networks get HTTP 429 from repo.maven.apache.org).
ARG MAVEN_MIRROR=https://repo.maven.apache.org/maven2
RUN mkdir -p /root/.m2 && printf '<settings><mirrors><mirror><id>mirror</id><mirrorOf>central</mirrorOf><url>%s</url></mirror></mirrors></settings>' "$MAVEN_MIRROR" > /root/.m2/settings.xml
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
