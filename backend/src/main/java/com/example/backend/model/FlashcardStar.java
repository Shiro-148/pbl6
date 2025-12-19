package com.example.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "flashcard_stars", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "card_id" })
})
public class FlashcardStar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "set_id", nullable = false)
    private Long setId;

    @Column(name = "card_id", nullable = false)
    private Long cardId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    public FlashcardStar() {
    }

    public FlashcardStar(Long setId, Long cardId, Long userId) {
        this.setId = setId;
        this.cardId = cardId;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSetId() {
        return setId;
    }

    public void setSetId(Long setId) {
        this.setId = setId;
    }

    public Long getCardId() {
        return cardId;
    }

    public void setCardId(Long cardId) {
        this.cardId = cardId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
