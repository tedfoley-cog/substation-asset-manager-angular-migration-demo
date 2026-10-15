package com.meridian.sam.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SubstationDto(Long id, String code, String name, String region, BigDecimal nominalKv,
                            BigDecimal latitude, BigDecimal longitude, LocalDate commissionedOn,
                            String operatorNotes, int bayCount, long iedCount, List<BayDto> bays) {}
