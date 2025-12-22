package com.example.stylo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "saved_states")
public class SavedState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Space space;

    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mannequin_id")
    private Photo mannequin;

    @OneToMany(mappedBy = "savedState", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SavedStateItem> items;
}
