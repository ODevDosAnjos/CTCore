package br.com.ctcore.seed;

import java.nio.file.Path;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** #671: só com {@code CTCORE_SEED=homologacao}. O clean do Flyway é ligado aqui, nunca no application.yml. */
@Configuration
@ConditionalOnProperty(name = "ctcore.seed.mode", havingValue = "homologacao")
public class HomologationSeedConfig {

    @Bean
    FlywayMigrationStrategy homologationSeedStrategy(@Value("${ctcore.seed.dir}") String dir,
                                                     @Value("${spring.datasource.username}") String runtimeUser) {
        return flyway -> {
            Flyway withClean = Flyway.configure().configuration(flyway.getConfiguration()).cleanDisabled(false).load();
            new HomologationSeed(withClean, Path.of(dir), runtimeUser, System.getenv("CTCORE_ENV")).run();
        };
    }
}
