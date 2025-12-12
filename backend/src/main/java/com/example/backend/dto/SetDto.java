package com.example.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class SetDto {
    private Long id;
    private String title;
    private String description;
    private String access;
    private List<FlashcardDto> cards = new ArrayList<>();
    private Long folderId;
    private int cardCount;

    public SetDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAccess() {
        return access;
    }

    public void setAccess(String access) {
        this.access = access;
    }

    public List<FlashcardDto> getCards() {
        return cards;
    }

    public void setCards(List<FlashcardDto> cards) {
        this.cards = cards;
    }

    public Long getFolderId() {
        return folderId;
    }

    public void setFolderId(Long folderId) {
        this.folderId = folderId;
    }

    public int getCardCount() {
        return cardCount;
    }

    public void setCardCount(int cardCount) {
        this.cardCount = cardCount;
    }
}