package com.meridian.sam.config;

import com.meridian.sam.auth.CurrentUser;
import io.swagger.v3.oas.models.OpenAPI;
import org.springdoc.core.utils.SpringDocUtils;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    static {
        SpringDocUtils.getConfig().addRequestWrapperToIgnore(CurrentUser.class);
    }

    @Bean
    public OpenAPI samOpenApi() {
        return new OpenAPI().info(new Info()
            .title("Substation Asset Manager API")
            .version("4.11.2")
            .description("Protection relay / IED inventory, settings-file history and comparison, IEC 61850 SCL import, "
                + "COMTRADE disturbance-record retrieval and the operator audit trail. The committed contract lives in "
                + "api/openapi.yaml; the contract tests fail when this generated document drifts from it.")
            .license(new License().name("Internal")));
    }
}
