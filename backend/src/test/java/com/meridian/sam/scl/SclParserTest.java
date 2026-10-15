package com.meridian.sam.scl;

import org.junit.jupiter.api.Test;
import java.io.InputStream;
import static org.assertj.core.api.Assertions.*;

class SclParserTest {
    private final SclParser parser = new SclParser();

    private InputStream fixture(String name) { return getClass().getResourceAsStream("/scl/" + name); }

    @Test
    void parsesStationFileHeaderSubstationAndIeds() {
        SclDocument doc = parser.parse(fixture("NTH-01_station.scd"));
        assertThat(doc.version()).isEqualTo("2007");
        assertThat(doc.revision()).isEqualTo("B");
        assertThat(doc.headerId()).isEqualTo("NTH-01_station");
        assertThat(doc.toolId()).startsWith("Station Configuration Tool");
        assertThat(doc.substationName()).isEqualTo("NTH-01");
        assertThat(doc.ieds()).extracting(SclDocument.SclIed::name)
            .containsExactly("NTH01_T1_87T", "NTH01_T1_BCU", "NTH01_L1_21", "NTH01_HMI");
    }

    @Test
    void resolvesIpAddressFromCommunicationSectionAndLogicalNodeClasses() {
        SclDocument doc = parser.parse(fixture("NTH-01_station.scd"));
        SclDocument.SclIed relay = doc.ieds().get(0);
        assertThat(relay.manufacturer()).isEqualTo("Relay Platform");
        assertThat(relay.type()).isEqualTo("RP-721-B2");
        assertThat(relay.configVersion()).isEqualTo("2.42.15");
        assertThat(relay.accessPoint()).isEqualTo("AP1");
        assertThat(relay.ipAddress()).isEqualTo("10.41.1.11");
        assertThat(relay.lnClasses()).containsExactly("LLN0", "LPHD", "PDIF", "PTOC", "PIOC", "PTUV", "PTRC", "RDRE", "TCTR", "MMXU");
        SclDocument.SclIed line = doc.ieds().get(2);
        assertThat(line.lnClasses()).contains("PDIS", "PSCH", "RREC", "RSYN").doesNotHaveDuplicates();
    }

    @Test
    void clientOnlyIedProducesWarningNotFailure() {
        SclDocument doc = parser.parse(fixture("NTH-01_station.scd"));
        assertThat(doc.warnings()).containsExactly("IED NTH01_HMI has an AccessPoint without a Server (client-only IED)");
        assertThat(doc.ieds().get(3).lnClasses()).isEmpty();
        assertThat(doc.ieds().get(3).ipAddress()).isNull();
    }

    @Test
    void subNetworkWithoutNameIsRejected() {
        assertThatThrownBy(() -> parser.parse(fixture("broken_subnetwork.scd")))
            .isInstanceOf(SclParseException.class)
            .hasMessage("Communication/SubNetwork is missing required attribute name");
    }

    @Test
    void nonSclRootIsRejectedWithNamespaceInMessage() {
        assertThatThrownBy(() -> parser.parse(fixture("not_scl.xml")))
            .isInstanceOf(SclParseException.class)
            .hasMessageContaining("http://www.iec.ch/61850/2003/SCL")
            .hasMessageContaining("urn:relay-platform:settings:1.0");
    }

    @Test
    void doctypeIsRefused() {
        String xxe = "<?xml version=\"1.0\"?><!DOCTYPE SCL [<!ENTITY x SYSTEM \"file:///etc/hostname\">]><SCL xmlns=\"http://www.iec.ch/61850/2003/SCL\">&x;</SCL>";
        assertThatThrownBy(() -> parser.parse(new java.io.ByteArrayInputStream(xxe.getBytes())))
            .isInstanceOf(SclParseException.class)
            .hasMessageContaining("Not a well-formed XML document");
    }
}
