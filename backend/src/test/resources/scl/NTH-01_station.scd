<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2007" revision="B" release="4">
  <Header id="NTH-01_station" version="3" revision="2" toolID="Station Configuration Tool 5.2" nameStructure="IEDName">
    <History>
      <Hitem version="3" revision="2" when="2023-11-02T14:30:00Z" who="rvasquez" what="Added NTH01_BS_50BF after bus-section refurbishment"/>
    </History>
  </Header>
  <Substation name="NTH-01" desc="Northgate 132/33 kV">
    <VoltageLevel name="E1" desc="132 kV">
      <Voltage unit="V" multiplier="k">132</Voltage>
      <Bay name="T1" desc="T1 132/33 kV">
        <ConductingEquipment name="QA1" type="CBR">
          <LNode iedName="NTH01_T1_BCU" ldInst="CTRL" lnClass="XCBR" lnInst="1"/>
        </ConductingEquipment>
        <LNode iedName="NTH01_T1_87T" ldInst="PROT" lnClass="PDIF" lnInst="1"/>
      </Bay>
      <Bay name="L1" desc="Line 1 to NTH-02">
        <LNode iedName="NTH01_L1_21" ldInst="PROT" lnClass="PDIS" lnInst="1"/>
      </Bay>
    </VoltageLevel>
  </Substation>
  <Communication>
    <SubNetwork name="StationBus" type="8-MMS">
      <ConnectedAP iedName="NTH01_T1_87T" apName="AP1">
        <Address>
          <P type="IP">10.41.1.11</P>
          <P type="IP-SUBNET">255.255.255.0</P>
          <P type="IP-GATEWAY">10.41.1.1</P>
          <P type="OSI-AP-Title">1,1,9999,1</P>
          <P type="OSI-AE-Qualifier">12</P>
          <P type="OSI-PSEL">00000001</P>
          <P type="OSI-SSEL">0001</P>
          <P type="OSI-TSEL">0001</P>
        </Address>
      </ConnectedAP>
      <ConnectedAP iedName="NTH01_T1_BCU" apName="AP1">
        <Address><P type="IP">10.41.1.12</P><P type="IP-SUBNET">255.255.255.0</P><P type="IP-GATEWAY">10.41.1.1</P></Address>
        <GSE ldInst="CTRL" cbName="gcbInterlock">
          <Address><P type="MAC-Address">01-0C-CD-01-00-01</P><P type="APPID">0001</P><P type="VLAN-ID">005</P><P type="VLAN-PRIORITY">4</P></Address>
          <MinTime unit="s" multiplier="m">4</MinTime>
          <MaxTime unit="s" multiplier="m">1000</MaxTime>
        </GSE>
      </ConnectedAP>
      <ConnectedAP iedName="NTH01_L1_21" apName="AP1">
        <Address><P type="IP">10.41.1.31</P><P type="IP-SUBNET">255.255.255.0</P><P type="IP-GATEWAY">10.41.1.1</P></Address>
      </ConnectedAP>
    </SubNetwork>
  </Communication>
  <IED name="NTH01_T1_87T" type="RP-721-B2" manufacturer="Relay Platform" configVersion="2.42.15" originalSclVersion="2007" originalSclRevision="B">
    <Services><GetDirectory/><GetDataObjectDefinition/><GetDataSetValue/><ConfDataSet max="20" maxAttributes="100"/><ReportSettings cbName="Conf" datSet="Conf" rptID="Dyn" optFields="Dyn" bufTime="Dyn" trgOps="Dyn"/><GOOSE max="8"/><FileHandling/></Services>
    <AccessPoint name="AP1">
      <Server>
        <Authentication none="true"/>
        <LDevice inst="PROT">
          <LN0 lnClass="LLN0" inst="" lnType="RP_LLN0">
            <DataSet name="dsTrip"><FCDA ldInst="PROT" prefix="" lnClass="PTRC" lnInst="1" doName="Tr" daName="general" fc="ST"/></DataSet>
            <ReportControl name="rcbTrip" datSet="dsTrip" rptID="NTH01_T1_87T/PROT/LLN0.rcbTrip" confRev="1" buffered="true" bufTime="50"><TrgOps dchg="true" qchg="true"/><OptFields seqNum="true" timeStamp="true" dataSet="true" reasonCode="true"/><RptEnabled max="4"/></ReportControl>
          </LN0>
          <LN lnClass="LPHD" inst="1" lnType="RP_LPHD"/>
          <LN lnClass="PDIF" inst="1" prefix="T1" lnType="RP_PDIF"/>
          <LN lnClass="PTOC" inst="1" prefix="HV" lnType="RP_PTOC"/>
          <LN lnClass="PIOC" inst="1" prefix="HV" lnType="RP_PIOC"/>
          <LN lnClass="PTUV" inst="1" lnType="RP_PTUV"/>
          <LN lnClass="PTRC" inst="1" lnType="RP_PTRC"/>
          <LN lnClass="RDRE" inst="1" lnType="RP_RDRE"/>
          <LN lnClass="TCTR" inst="1" prefix="HV" lnType="RP_TCTR"/>
          <LN lnClass="MMXU" inst="1" lnType="RP_MMXU"/>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>
  <IED name="NTH01_T1_BCU" type="BC-910" manufacturer="Relay Platform" configVersion="7.3.1">
    <AccessPoint name="AP1">
      <Server>
        <Authentication none="true"/>
        <LDevice inst="CTRL">
          <LN0 lnClass="LLN0" inst="" lnType="BC_LLN0"/>
          <LN lnClass="LPHD" inst="1" lnType="BC_LPHD"/>
          <LN lnClass="CSWI" inst="1" prefix="QA1" lnType="BC_CSWI"/>
          <LN lnClass="CILO" inst="1" prefix="QA1" lnType="BC_CILO"/>
          <LN lnClass="XCBR" inst="1" prefix="QA1" lnType="BC_XCBR"/>
          <LN lnClass="XSWI" inst="1" prefix="QB1" lnType="BC_XSWI"/>
          <LN lnClass="MMXU" inst="1" lnType="BC_MMXU"/>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>
  <IED name="NTH01_L1_21" type="RP-511-A" manufacturer="Relay Platform" configVersion="4.08.11">
    <AccessPoint name="AP1">
      <Server>
        <Authentication none="true"/>
        <LDevice inst="PROT">
          <LN0 lnClass="LLN0" inst="" lnType="RP_LLN0"/>
          <LN lnClass="LPHD" inst="1" lnType="RP_LPHD"/>
          <LN lnClass="PDIS" inst="1" prefix="Z1" lnType="RP_PDIS"/>
          <LN lnClass="PDIS" inst="2" prefix="Z2" lnType="RP_PDIS"/>
          <LN lnClass="PSCH" inst="1" lnType="RP_PSCH"/>
          <LN lnClass="RREC" inst="1" lnType="RP_RREC"/>
          <LN lnClass="RSYN" inst="1" lnType="RP_RSYN"/>
          <LN lnClass="PTRC" inst="1" lnType="RP_PTRC"/>
          <LN lnClass="RDRE" inst="1" lnType="RP_RDRE"/>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>
  <IED name="NTH01_HMI" type="Station HMI" manufacturer="Relay Platform" configVersion="1.0">
    <AccessPoint name="AP1"/>
  </IED>
  <DataTypeTemplates>
    <LNodeType id="RP_LLN0" lnClass="LLN0"><DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="Health" type="ENS_Health"/><DO name="NamPlt" type="LPL_NamPlt"/></LNodeType>
    <LNodeType id="RP_LPHD" lnClass="LPHD"><DO name="PhyNam" type="DPL_PhyNam"/><DO name="PhyHealth" type="ENS_Health"/><DO name="Proxy" type="SPS_Proxy"/></LNodeType>
    <LNodeType id="RP_PDIF" lnClass="PDIF"><DO name="Mod" type="ENC_Mod"/><DO name="Beh" type="ENS_Beh"/><DO name="Health" type="ENS_Health"/><DO name="NamPlt" type="LPL_NamPlt"/><DO name="Op" type="ACT_Op"/><DO name="Str" type="ACD_Str"/><DO name="LinCapac" type="ASG_LinCapac"/></LNodeType>
    <DOType id="ENC_Mod" cdc="ENC"><DA name="stVal" bType="Enum" type="BehaviourModeKind" fc="ST" dchg="true"/><DA name="q" bType="Quality" fc="ST" qchg="true"/><DA name="t" bType="Timestamp" fc="ST"/><DA name="ctlModel" bType="Enum" type="CtlModelKind" fc="CF"/></DOType>
    <EnumType id="BehaviourModeKind"><EnumVal ord="1">on</EnumVal><EnumVal ord="2">blocked</EnumVal><EnumVal ord="3">test</EnumVal><EnumVal ord="4">test/blocked</EnumVal><EnumVal ord="5">off</EnumVal></EnumType>
  </DataTypeTemplates>
</SCL>
