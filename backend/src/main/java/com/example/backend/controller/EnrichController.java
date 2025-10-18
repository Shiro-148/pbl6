package com.example.backend.controller;

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
public class EnrichController {

    @PostMapping("/enrich")
    public ResponseEntity<?> enrich(@RequestBody Map<String, Object> body) {
        try {
            String text = null;
            if (body.containsKey("text"))
                text = (String) body.get("text");
            else if (body.containsKey("words")) {
                Object w = body.get("words");
                // naive join if array of strings
                if (w instanceof java.util.List) {
                    StringBuilder sb = new StringBuilder();
                    for (Object o : (java.util.List<?>) w) {
                        sb.append(String.valueOf(o)).append(' ');
                    }
                    text = sb.toString();
                }
            }

            if (text == null)
                return ResponseEntity.badRequest().body(Map.of("error", "Provide 'text' or 'words'"));

            RestTemplate rest = new RestTemplate();
            String url = "http://localhost:5000/flashcards";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, String> req = new HashMap<>();
            req.put("text", text);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(req, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> res = rest.postForObject(url, entity, Map.class);
            return ResponseEntity.ok(res);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
