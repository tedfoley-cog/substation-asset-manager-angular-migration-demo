package com.meridian.sam.arch;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.*;
import static com.tngtech.archunit.core.domain.properties.CanBeAnnotated.Predicates.annotatedWith;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

/** Enforces standards/CODING_STANDARD.md section 3 (layering) on the backend. */
@AnalyzeClasses(packages = "com.meridian.sam", importOptions = com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests.class)
class LayeringRulesTest {

    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringOnlyDependenciesInLayers()
        .layer("Web").definedBy("..web..")
        .layer("Service").definedBy("..service..", "..scl..", "..audit..")
        .layer("Auth").definedBy("..auth..")
        .layer("Repository").definedBy("..repository..")
        .layer("Domain").definedBy("..domain..")
        .whereLayer("Web").mayNotBeAccessedByAnyLayer()
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Web", "Service")
        .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service", "Auth");

    @ArchTest
    static final ArchRule controllersDoNotUseRepositories = noClasses().that().resideInAPackage("..web..")
        .should().dependOnClassesThat().resideInAPackage("..repository..")
        .because("controllers delegate to services; data access in a controller is the 'logic in the wrong layer' failure mode");

    @ArchTest
    static final ArchRule controllersDoNotReturnEntities = noMethods().that().areDeclaredInClassesThat().resideInAPackage("..web..")
        .and().areDeclaredInClassesThat().haveSimpleNameEndingWith("Controller").and().arePublic()
        .should().haveRawReturnType(annotatedWith(jakarta.persistence.Entity.class))
        .because("API responses are DTOs (standards/INTERFACE_CONTRACT_STANDARD.md section 2)");

    @ArchTest
    static final ArchRule servicesAreTransactional = classes().that().resideInAPackage("..service..")
        .and().haveSimpleNameEndingWith("Service")
        .should().beAnnotatedWith(org.springframework.transaction.annotation.Transactional.class);
}
