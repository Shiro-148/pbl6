"""
Tích hợp logic predict từ Jupyter notebook vào model service
Sử dụng FastText + TensorFlow model để predict độ khó từ
"""
import re
import numpy as np
import pandas as pd
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import load_model
import tensorflow as tf

# Custom Attention layer từ notebook
class Attention(tf.keras.layers.Layer):
    def __init__(self, **kwargs):
        super(Attention, self).__init__(**kwargs)

    def build(self, input_shape):
        self.W = self.add_weight(name="att_weight", shape=(input_shape[-1], 1),
                                 initializer="normal")
        self.b = self.add_weight(name="att_bias", shape=(input_shape[1], 1),
                                 initializer="zeros")
        super(Attention, self).build(input_shape)

    def call(self, x):
        e = tf.keras.backend.tanh(tf.keras.backend.dot(x, self.W) + self.b)
        a = tf.keras.backend.softmax(e, axis=1)
        return tf.keras.backend.sum(a * x, axis=1)

class FastTextPredictor:
    def __init__(self):
        self.model = None
        self.char_vocab = None
        self.ft_model = None
        self.maxlen = 21
        
    def load_models(self):
        """Load TensorFlow model, char vocab, và FastText model"""
        try:
            # Load TensorFlow model với custom Attention layer
            self.model = load_model(
                "word_difficulty_hybrid_fasttext.h5",
                compile=False,
                custom_objects={"Attention": Attention}
            )
            self.model.compile(optimizer=tf.keras.optimizers.Adam(1e-4), loss="mse")
            
            # Load character vocabulary
            with open("char_vocab.pkl", "rb") as f:
                self.char_vocab = pickle.load(f)
                
            # Load FastText model
            import fasttext
            self.ft_model = fasttext.load_model("cc.en.300.bin")
            
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            return False
    
    def clean_token(self, w):
        """Clean word token"""
        w = w.lower().replace("'", "")
        return re.sub(r"[^a-z]", "", w)
    
    def words_to_char_seq(self, words, maxlen=21):
        """Convert words to character sequences"""
        seqs = [[self.char_vocab.get(c, 0) for c in w] for w in words]
        return pad_sequences(seqs, maxlen=maxlen, padding="post")
    
    def words_to_vectors(self, words):
        """Convert words to FastText vectors"""
        return np.array([self.ft_model.get_word_vector(w) for w in words])
    
    def ordinal_decode(self, p, t1=0.5, t2=1.5):
        """Decode prediction to difficulty level"""
        if p < t1:
            return 0  # easy
        elif p < t2:
            return 1  # medium
        else:
            return 2  # hard
    
    def predict_word_difficulty(self, words, t1=0.5, t2=1.5):
        """Predict difficulty for list of words"""
        if not self.model or not self.char_vocab or not self.ft_model:
            print("Models not loaded")
            return []
            
        results = []
        clean_words = [self.clean_token(w) for w in words if len(self.clean_token(w)) > 0]
        
        if len(clean_words) == 0:
            return []
        
        # Prepare inputs
        X_char = self.words_to_char_seq(clean_words, maxlen=self.maxlen)
        X_ft = self.words_to_vectors(clean_words)
        
        # Predict
        preds = self.model.predict([X_char, X_ft], verbose=0).flatten()
        
        # Convert to results
        for w, p in zip(clean_words, preds):
            level = self.ordinal_decode(p, t1, t2)
            level_name = ['easy', 'medium', 'hard'][level]
            results.append({
                'word': w, 
                'level': level_name,
                'difficulty': level,
                'probability': round(float(p), 3)
            })
        
        return results

# Global instance
fasttext_predictor = FastTextPredictor()