package com.meridian.sam.scl;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Namespace-aware reader for IEC 61850-6 SCL files (.icd/.cid/.scd/.ssd). Reads Header, the first Substation,
 * every IED with its AccessPoint/Server/LDevice/LN0+LN classes, and resolves ConnectedAP IP addresses from the
 * Communication section. Does not validate against the SCL XSD; structural problems surface as warnings or a
 * {@link SclParseException}.
 */
public final class SclParser {
    public static final String SCL_NS = "http://www.iec.ch/61850/2003/SCL";

    public SclDocument parse(InputStream in) {
        Document doc;
        try {
            DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
            f.setNamespaceAware(true);
            f.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            f.setXIncludeAware(false);
            f.setExpandEntityReferences(false);
            DocumentBuilder b = f.newDocumentBuilder();
            doc = b.parse(in);
        } catch (ParserConfigurationException | SAXException | IOException e) {
            throw new SclParseException("Not a well-formed XML document: " + e.getMessage(), e);
        }
        Element root = doc.getDocumentElement();
        if (!"SCL".equals(root.getLocalName()) || !SCL_NS.equals(root.getNamespaceURI())) {
            throw new SclParseException("Root element must be {" + SCL_NS + "}SCL but was {" + root.getNamespaceURI() + "}" + root.getLocalName());
        }
        List<String> warnings = new ArrayList<>();
        String version = attr(root, "version");
        String revision = attr(root, "revision");
        Element header = firstChild(root, "Header");
        if (header == null) {
            warnings.add("SCL/Header is missing (required by IEC 61850-6)");
        }
        String headerId = header == null ? null : attr(header, "id");
        String toolId = header == null ? null : attr(header, "toolID");

        Element substation = firstChild(root, "Substation");
        String substationName = substation == null ? null : attr(substation, "name");

        Map<String, String> apAddresses = new LinkedHashMap<>();
        Element comm = firstChild(root, "Communication");
        if (comm != null) {
            for (Element subnet : children(comm, "SubNetwork")) {
                if (attr(subnet, "name") == null) {
                    throw new SclParseException("Communication/SubNetwork is missing required attribute name");
                }
                for (Element cap : children(subnet, "ConnectedAP")) {
                    Element address = firstChild(cap, "Address");
                    if (address == null) continue;
                    for (Element p : children(address, "P")) {
                        if ("IP".equals(attr(p, "type"))) {
                            apAddresses.put(attr(cap, "iedName") + "/" + attr(cap, "apName"), p.getTextContent().trim());
                        }
                    }
                }
            }
        }

        List<SclDocument.SclIed> ieds = new ArrayList<>();
        for (Element ied : children(root, "IED")) {
            String name = attr(ied, "name");
            if (name == null || name.isBlank()) {
                throw new SclParseException("IED element without a name attribute");
            }
            Element ap = firstChild(ied, "AccessPoint");
            String apName = ap == null ? null : attr(ap, "name");
            Set<String> lnClasses = new LinkedHashSet<>();
            if (ap != null) {
                Element server = firstChild(ap, "Server");
                if (server != null) {
                    for (Element ld : children(server, "LDevice")) {
                        Element ln0 = firstChild(ld, "LN0");
                        if (ln0 != null) lnClasses.add(attr(ln0, "lnClass"));
                        for (Element ln : children(ld, "LN")) lnClasses.add(attr(ln, "lnClass"));
                    }
                } else {
                    warnings.add("IED " + name + " has an AccessPoint without a Server (client-only IED)");
                }
            } else {
                warnings.add("IED " + name + " has no AccessPoint");
            }
            String ip = apName == null ? null : apAddresses.get(name + "/" + apName);
            ieds.add(new SclDocument.SclIed(name, attr(ied, "manufacturer"), attr(ied, "type"), attr(ied, "configVersion"),
                apName, ip, new ArrayList<>(lnClasses)));
        }
        if (ieds.isEmpty()) {
            warnings.add("No IED elements found");
        }
        return new SclDocument(version, revision, headerId, toolId, substationName, ieds, warnings);
    }

    private static String attr(Element e, String name) {
        return e.hasAttribute(name) ? e.getAttribute(name) : null;
    }

    private static Element firstChild(Element parent, String localName) {
        List<Element> c = children(parent, localName);
        return c.isEmpty() ? null : c.get(0);
    }

    private static List<Element> children(Element parent, String localName) {
        List<Element> out = new ArrayList<>();
        NodeList nl = parent.getChildNodes();
        for (int i = 0; i < nl.getLength(); i++) {
            Node n = nl.item(i);
            if (n.getNodeType() == Node.ELEMENT_NODE && SCL_NS.equals(n.getNamespaceURI()) && localName.equals(n.getLocalName())) {
                out.add((Element) n);
            }
        }
        return out;
    }
}
