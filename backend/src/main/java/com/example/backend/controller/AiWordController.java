package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/flashcards")
public class AiWordController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${model.service.base-url:http://localhost:5000}")
    private String modelServiceBaseUrl;

    @PostMapping("/ai-word")
    public ResponseEntity<?> generateWord(@RequestBody Map<String, Object> body) {
        try {
            Object raw = body.get("word");
            String word = raw == null ? "" : String.valueOf(raw).trim();
            if (word.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing 'word'"));
            }

            String url = modelServiceBaseUrl + "/word-info";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, String> request = new HashMap<>();
            request.put("word", word);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
