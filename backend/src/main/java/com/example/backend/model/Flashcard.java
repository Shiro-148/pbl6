package com.example.backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "flashcards")
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String word;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @Column(length = 100)
    private String phonetic;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(length = 50)
    private String type;

    @Column(length = 500)
    private String audio;

    @Column(columnDefinition = "TEXT")
    private String mcqOptions; // JSON array of options for multiple choice caching
    private String sentenceOptions; // JSON array of sentences for sentence choice caching

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id")
    @JsonBackReference
    private FlashcardSet set;

    public Flashcard() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getDefinition() {
        return definition;
    }

    public void setDefinition(String definition) {
        this.definition = definition;
    }

    public String getPhonetic() {
        return phonetic;
    }

    public void setPhonetic(String phonetic) {
        this.phonetic = phonetic;
    }

    public String getExample() {
        return example;
    }

    public void setExample(String example) {
        this.example = example;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAudio() {
        return audio;
    }

    public void setAudio(String audio) {
        this.audio = audio;
    }

    public String getMcqOptions() {
        return mcqOptions;
    }

    public void setMcqOptions(String mcqOptions) {
        this.mcqOptions = mcqOptions;
    }

    public String getSentenceOptions() {
        return sentenceOptions;
    }

    public void setSentenceOptions(String sentenceOptions) {
        this.sentenceOptions = sentenceOptions;
    }

    public FlashcardSet getSet() {
        return set;
    }

    public void setSet(FlashcardSet set) {
        this.set = set;
    }
}
