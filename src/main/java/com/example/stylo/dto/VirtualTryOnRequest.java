package com.example.stylo.dto;

import java.util.List;
import lombok.Data;

@Data
public class VirtualTryOnRequest {
    private Long mannequinPhotoId;
    private Long clothPhotoId;
    // Keeping this for future support of multiple items
    private List<Long> clothingPhotoIds;
}