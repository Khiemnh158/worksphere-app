FROM eclipse-temurin:21-jdk@sha256:ebfbb18d11ff163ee83b21258acf12248af48d22a0fdfdc68fa1a1516c05976a AS build
WORKDIR /src
COPY .mvn/ .mvn/
COPY mvnw pom.xml checkstyle.xml ./
COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine@sha256:ac05c3c42b7c2f1a52c9bd52f01041fa1958231b15ebeae7420429cbc5baf474
RUN addgroup -S -g 10001 worksphere && adduser -S -D -u 10001 -G worksphere worksphere \
    && mkdir -p /var/lib/worksphere/uploads /var/lib/worksphere/mail \
    && chown -R worksphere:worksphere /var/lib/worksphere
WORKDIR /app
COPY --from=build /src/target/worksphere-web.jar /app/worksphere.jar
USER worksphere
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/worksphere.jar"]
