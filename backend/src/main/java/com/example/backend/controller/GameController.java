package com.example.backend.controller;

import com.example.backend.model.Flashcard;
import com.example.backend.repository.FlashcardRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final FlashcardRepository flashcardRepository;

    public GameController(FlashcardRepository flashcardRepository) {
        this.flashcardRepository = flashcardRepository;
    }

    @GetMapping("/multiple-choice")
    public ResponseEntity<?> getMultipleChoice(@RequestParam Long setId,
            @RequestParam(defaultValue = "4") int optionsCount) {
        if (setId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing setId"));
        }
        int nDistractors = Math.max(2, optionsCount - 1);
        List<Flashcard> cards = flashcardRepository.findBySetId(setId);
        if (cards == null || cards.isEmpty()) {
            return ResponseEntity.ok(Map.of("questions", List.of()));
        }

        List<Map<String, Object>> questions = new ArrayList<>();
        List<Map<String, String>> toGenerate = new ArrayList<>();
        Map<String, Flashcard> byTerm = new HashMap<>();

        for (Flashcard c : cards) {
            String term = Optional.ofNullable(c.getWord()).orElse("").trim();
            String correct = Optional.ofNullable(c.getDefinition()).orElse("").trim();
            if (term.isEmpty())
                continue;
            byTerm.put(term, c);
            String cached = c.getMcqOptions();
            if (cached != null && !cached.isBlank()) {
                List<String> options = parseOptionsJson(cached);
                if (options.stream().noneMatch(o -> o.equalsIgnoreCase(correct))) {
                    options.add(correct);
                }
                options = shuffleWithCorrect(correct, options, nDistractors);
                questions.add(Map.of("term", term, "correct", correct, "options", options));
            } else {
                toGenerate.add(Map.of("term", term, "definition", correct));
            }
        }

        if (!toGenerate.isEmpty()) {
            try {
                List<Map<String, Object>> gen = callModelServiceGenerate(toGenerate, optionsCount);
                for (Map<String, Object> q : gen) {
                    String term = Objects.toString(q.get("term"), "");
                    String correct = Objects.toString(q.get("correct"), "");
                    @SuppressWarnings("unchecked")
                    List<String> opts = (List<String>) q.getOrDefault("options", List.of());
                    Flashcard card = byTerm.get(term);
                    if (card != null && opts != null && !opts.isEmpty()) {
                        card.setMcqOptions(toJsonArray(opts));
                        flashcardRepository.save(card);
                        if (opts.stream().noneMatch(o -> o.equalsIgnoreCase(correct))) {
                            opts.add(correct);
                        }
                        opts = shuffleWithCorrect(correct, opts, nDistractors);
                        questions.add(Map.of("term", term, "correct", correct, "options", opts));
                    }
                }
            } catch (Exception ex) {
            }
        }

        return ResponseEntity.ok(Map.of("questions", questions));
    }

    @GetMapping("/sentence-choice")
    public ResponseEntity<?> getSentenceChoice(@RequestParam Long setId,
            @RequestParam(defaultValue = "4") int optionsCount) {
        if (setId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing setId"));
        }
        int nOptions = Math.max(2, optionsCount);
        List<Flashcard> cards = flashcardRepository.findBySetId(setId);
        if (cards == null || cards.isEmpty()) {
            return ResponseEntity.ok(Map.of("questions", List.of()));
        }

        List<Map<String, Object>> questions = new ArrayList<>();
        List<Map<String, String>> toGenerate = new ArrayList<>();
        Map<String, Flashcard> byWord = new HashMap<>();

        for (Flashcard c : cards) {
            String word = Optional.ofNullable(c.getWord()).orElse("").trim();
            if (word.isEmpty())
                continue;
            byWord.put(word, c);
            String cached = c.getSentenceOptions();
            if (cached != null && !cached.isBlank()) {
                List<String> sentences = parseOptionsJson(cached);
                if (sentences.size() > nOptions)
                    sentences = sentences.subList(0, nOptions);
                int correctIdx = 0; 
                questions.add(Map.of("word", word, "sentences", sentences, "correct_index", correctIdx));
            } else {
                toGenerate.add(Map.of("word", word));
            }
        }

        if (!toGenerate.isEmpty()) {
            try {
                List<Map<String, Object>> gen = callModelServiceGenerateSentences(toGenerate, nOptions);
                for (Map<String, Object> q : gen) {
                    String word = Objects.toString(q.get("word"), "");
                    @SuppressWarnings("unchecked")
                    List<String> sentences = (List<String>) q.getOrDefault("sentences", List.of());
                    Integer correctIdx = (Integer) q.getOrDefault("correct_index", 0);
                    Flashcard card = byWord.get(word);
                    if (card != null && sentences != null && !sentences.isEmpty()) {
                        card.setSentenceOptions(toJsonArray(sentences));
                        flashcardRepository.save(card);
                        if (sentences.size() > nOptions)
                            sentences = sentences.subList(0, nOptions);
                        questions.add(Map.of("word", word, "sentences", sentences, "correct_index", correctIdx));
                    }
                }
            } catch (Exception ex) {
            }
        }

        return ResponseEntity.ok(Map.of("questions", questions));
    }

    private List<String> parseOptionsJson(String json) {
        try {
            if (json.trim().startsWith("[")) {
                String s = json.trim();
                s = s.substring(1, s.length() - 1); 
                String[] parts = s.split(",");
                List<String> list = new ArrayList<>();
                for (String p : parts) {
                    String v = p.trim();
                    if (v.startsWith("\"") && v.endsWith("\"")) {
                        v = v.substring(1, v.length() - 1);
                    }
                    if (!v.isBlank())
                        list.add(v);
                }
                return list;
            }
            return Arrays.stream(json.split("\n")).map(String::trim).filter(s -> !s.isBlank())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    private String toJsonArray(List<String> opts) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < opts.size(); i++) {
            if (i > 0)
                sb.append(",");
            sb.append('"').append(escape(opts.get(i))).append('"');
        }
        sb.append("]");
        return sb.toString();
    }

    private String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private List<String> shuffle(List<String> list) {
        List<String> copy = new ArrayList<>(list);
        Collections.shuffle(copy);
        return copy;
    }

    private List<String> shuffleWithCorrect(String correct, List<String> options, int nDistractors) {
        List<String> pool = new ArrayList<>();
        pool.add(correct);
        for (String o : options) {
            if (pool.size() >= nDistractors + 1)
                break;
            if (o.equalsIgnoreCase(correct))
                continue;
            pool.add(o);
        }
        Collections.shuffle(pool);
        return pool;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> callModelServiceGenerate(List<Map<String, String>> pairs, int optionsCount) {
        String base = Optional.ofNullable(System.getenv("MODEL_SERVICE_BASE")).orElse("http://localhost:5000");
        try {
            var url = new java.net.URL(base + "/generate-distractors");
            var conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            String payload = toJsonPayload(pairs, optionsCount);
            try (var os = conn.getOutputStream()) {
                os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
            int status = conn.getResponseCode();
            if (status >= 200 && status < 300) {
                String resp = new String(conn.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> root = mapper.readValue(resp, Map.class);
                Object qs = root.get("questions");
                if (qs instanceof List<?>) {
                    return (List<Map<String, Object>>) qs;
                }
            }
        } catch (Exception e) {
        }
        return List.of();
    }

    private String toJsonPayload(List<Map<String, String>> pairs, int optionsCount) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        sb.append("\"options_count\":").append(optionsCount).append(',');
        sb.append("\"pairs\":[");
        for (int i = 0; i < pairs.size(); i++) {
            if (i > 0)
                sb.append(',');
            Map<String, String> p = pairs.get(i);
            sb.append('{');
            sb.append("\"term\":\"").append(escape(p.getOrDefault("term", ""))).append("\",");
            sb.append("\"definition\":\"").append(escape(p.getOrDefault("definition", ""))).append("\"");
            sb.append('}');
        }
        sb.append("]}");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> callModelServiceGenerateSentences(List<Map<String, String>> words,
            int optionsCount) {
        String base = Optional.ofNullable(System.getenv("MODEL_SERVICE_BASE")).orElse("http://localhost:5000");
        try {
            var url = new java.net.URL(base + "/generate-sentences");
            var conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            String payload = toJsonSentencesPayload(words, optionsCount);
            try (var os = conn.getOutputStream()) {
                os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
            int status = conn.getResponseCode();
            if (status >= 200 && status < 300) {
                String resp = new String(conn.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> root = mapper.readValue(resp, Map.class);
                Object qs = root.get("questions");
                if (qs instanceof List<?>) {
                    return (List<Map<String, Object>>) qs;
                }
            }
        } catch (Exception e) {
            // ignored
        }
        return List.of();
    }

    private String toJsonSentencesPayload(List<Map<String, String>> words, int optionsCount) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        sb.append("\"options_count\":").append(optionsCount).append(',');
        sb.append("\"words\":[");
        for (int i = 0; i < words.size(); i++) {
            if (i > 0)
                sb.append(',');
            Map<String, String> p = words.get(i);
            sb.append('"').append(escape(p.getOrDefault("word", ""))).append('"');
        }
        sb.append(']');
        sb.append('}');
        return sb.toString();
    }
}
