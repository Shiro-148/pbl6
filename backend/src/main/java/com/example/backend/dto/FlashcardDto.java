package com.example.backend.dto;

public class FlashcardDto {
    private Long id;
    private String word;
    private String definition;
    private String phonetic;
    private String example;
    private String type;
    private String audio;
    private Long setId;
    private String mcqOptions;
    private String sentenceOptions;

    public FlashcardDto() {
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

    public Long getSetId() {
        return setId;
    }

    public void setSetId(Long setId) {
        this.setId = setId;
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
}
