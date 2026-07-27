package com.polaris.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompleteDayRequest {

    @NotNull(message = "Completed status is required")
    private Boolean completed;
}
