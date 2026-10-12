package com.argosquant.web.config;

import com.argosquant.database.DataSourceFactory;
import com.argosquant.database.DatabaseConfig;
import com.argosquant.database.MigrationRunner;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Wires the core JDBC datasource into the Spring context and applies schema
 * migrations once at startup. Keeps all persistence plumbing in one place so
 * controllers/services never construct connections themselves.
 */
@Configuration
public class PersistenceConfig {

    @Bean(destroyMethod = "close")
    public DataSource dataSource() {
        return DataSourceFactory.create(DatabaseConfig.fromEnvironment());
    }

    @Bean
    public ApplicationRunner schemaMigrator(DataSource dataSource) {
        return args -> new MigrationRunner(dataSource).migrate();
    }
}
