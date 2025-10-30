package com.example.backend.controller;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pdf")
public class PdfController {

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPdf(@RequestParam("file") MultipartFile file) {
        try (InputStream is = file.getInputStream(); PDDocument doc = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);

            Map<String, Object> resp = new HashMap<>();
            resp.put("rawText", text);
            resp.put("wordCountEstimate", text == null ? 0 : text.split("\\s+").length);

            // call model service classify and flashcards endpoints
            try {
                // Use a RestTemplate with short timeouts to avoid long hangs for large PDFs
                // Use HttpComponentsClientHttpRequestFactory (Apache HttpClient) which
                // handles request bodies and Content-Length more reliably than the
                // SimpleClientHttpRequestFactory in some environments.
        org.apache.hc.client5.http.config.RequestConfig requestConfig = org.apache.hc.client5.http.config.RequestConfig.custom()
            .setConnectTimeout(2000, java.util.concurrent.TimeUnit.MILLISECONDS)
            .setResponseTimeout(5000, java.util.concurrent.TimeUnit.MILLISECONDS)
            .build();
        org.apache.hc.client5.http.impl.classic.CloseableHttpClient httpClient = org.apache.hc.client5.http.impl.classic.HttpClients.custom()
            .setDefaultRequestConfig(requestConfig)
            .build();
        org.springframework.http.client.HttpComponentsClientHttpRequestFactory requestFactory = new org.springframework.http.client.HttpComponentsClientHttpRequestFactory(httpClient);
        RestTemplate rest = new RestTemplate(requestFactory);

                // Limit the amount of text sent to the model to avoid huge payloads
                String safeText = text == null ? "" : text;
                // Trim to first N characters or first M words
                final int MAX_CHARS = 10000; // adjust as needed
                final int MAX_WORDS = 1000;
                if (safeText.length() > MAX_CHARS) {
                    safeText = safeText.substring(0, MAX_CHARS);
                }
                // ensure not more than MAX_WORDS
                String[] words = safeText.split("\\s+");
                if (words.length > MAX_WORDS) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < MAX_WORDS; i++) {
                        sb.append(words[i]);
                        sb.append(' ');
                    }
                    safeText = sb.toString().trim();
                }

                // final copy used inside lambdas (after trimming)
                final String finalSafeText = safeText;

                String classifyUrl = "http://localhost:5000/classify";
                String flashUrl = "http://localhost:5000/flashcards";
                // Send as form-encoded to ensure a concrete request body is transmitted
                org.springframework.util.MultiValueMap<String, String> form = new org.springframework.util.LinkedMultiValueMap<>();
                form.add("text", finalSafeText != null ? finalSafeText : "");
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                HttpEntity<org.springframework.util.MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);

                // Call classify and flashcards in parallel to reduce wall-clock time
                java.util.concurrent.ExecutorService ex = java.util.concurrent.Executors.newFixedThreadPool(2);
                java.util.concurrent.Future<?> f1 = ex.submit(() -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> classifyRes = rest.postForObject(classifyUrl, entity, Map.class);
                        // normalize: frontend expects either an array in data.classify or an object
                        // with a 'words' array. Try to extract a words list if present.
                        if (classifyRes == null) {
                            resp.put("classify", null);
                        } else if (classifyRes.get("words") instanceof java.util.List) {
                            resp.put("classify", classifyRes.get("words"));
                        } else {
                            resp.put("classify", classifyRes);
                        }
                    } catch (Exception e) {
                        // store the error but also provide a safe fallback so the frontend can
                        // still present a level-selection dialog. Build a small token list from
                        // the trimmed safeText (limit to first 200 unique tokens of length>=2).
                        resp.put("classify_error", e.getMessage());
                        try {
                            java.util.Set<String> uniq = new java.util.LinkedHashSet<>();
                            String[] toks = finalSafeText.replaceAll("[^A-Za-zÀ-ỹ0-9\\s]", " ").split("\\s+");
                            for (String t : toks) {
                                if (t == null)
                                    continue;
                                String tt = t.trim();
                                if (tt.length() >= 2)
                                    uniq.add(tt);
                                if (uniq.size() >= 200)
                                    break;
                            }
                            java.util.List<Map<String, String>> fallback = new java.util.ArrayList<>();
                            for (String s : uniq) {
                                Map<String, String> m = new HashMap<>();
                                m.put("word", s);
                                // default to 'easy' for fallback so the frontend 'All' selection
                                // will include these tokens. Frontend uses 'easy','medium','hard'.
                                m.put("level", "easy");
                                fallback.add(m);
                            }
                            resp.put("classify", fallback);
                        } catch (Exception exx) {
                            // if even fallback building fails, leave classify absent
                            resp.put("classify", null);
                        }
                    }
                });

                java.util.concurrent.Future<?> f2 = ex.submit(() -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> flashRes = rest.postForObject(flashUrl, entity, Map.class);
                        resp.put("flashcards", flashRes);
                    } catch (Exception e) {
                        resp.put("flashcards_error", e.getMessage());
                    }
                });

                // Wait for both to complete but bound the wait so upload doesn't block forever
                try {
                    f1.get(6, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ignore) {
                    f1.cancel(true);
                }
                try {
                    f2.get(6, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ignore) {
                    f2.cancel(true);
                }
                ex.shutdownNow();

            } catch (Exception ex) {
                // if model service not available, include a warning but still return rawText
                resp.put("model_error", "Could not call model service: " + ex.getMessage());
            }

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Error processing PDF: " + e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }
}
