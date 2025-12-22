package com.example.stylo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "saved_state_items")
public class SavedStateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_state_id", nullable = false)
    @JsonIgnore
    private SavedState savedState;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "photo_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Photo photo;

    private int x;
    private int y;
    private int width;
    private int height;
    private int rotation;
}
