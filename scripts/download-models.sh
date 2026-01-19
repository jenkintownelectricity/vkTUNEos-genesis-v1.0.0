#!/bin/bash
# vkTUNEos Model Downloader
# Downloads all AI models for offline operation
#
# Total download: ~20GB
# Minimum VRAM: 8GB
# Recommended VRAM: 24GB
#
# Domain: vkTUNEos.com
# Version: 1.0

set -e

MODELS_DIR="${MODELS_DIR:-./models}"
CACHE_DIR="${CACHE_DIR:-./cache}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗   ██╗██╗  ██╗████████╗██╗   ██╗███╗   ██╗███████╗       ║
║   ██║   ██║██║ ██╔╝╚══██╔══╝██║   ██║████╗  ██║██╔════╝       ║
║   ██║   ██║█████╔╝    ██║   ██║   ██║██╔██╗ ██║█████╗         ║
║   ╚██╗ ██╔╝██╔═██╗    ██║   ██║   ██║██║╚██╗██║██╔══╝         ║
║    ╚████╔╝ ██║  ██╗   ██║   ╚██████╔╝██║ ╚████║███████╗       ║
║     ╚═══╝  ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝       ║
║                                                               ║
║           MODEL DOWNLOADER v1.0                               ║
║           Zero Data Collection • Offline Mode                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Create directories
mkdir -p "$MODELS_DIR"/{musicgen,rvc,demucs,whisper,cogvideo,lipsync}
mkdir -p "$CACHE_DIR"

# Function to download with progress
download() {
  local url=$1
  local dest=$2
  local name=$3

  if [ -f "$dest" ]; then
    echo -e "${GREEN}✓ $name already downloaded${NC}"
    return 0
  fi

  echo -e "${BLUE}Downloading $name...${NC}"
  if command -v aria2c &> /dev/null; then
    aria2c -x 16 -s 16 -o "$dest" "$url"
  elif command -v wget &> /dev/null; then
    wget --progress=bar:force -O "$dest" "$url"
  else
    curl -L -o "$dest" "$url"
  fi

  if [ -f "$dest" ]; then
    echo -e "${GREEN}✓ $name downloaded${NC}"
  else
    echo -e "${RED}✗ Failed to download $name${NC}"
    return 1
  fi
}

# Check if running with specific model flag
MODEL_TYPE="${1:-all}"

echo -e "${YELLOW}Models directory: $MODELS_DIR${NC}"
echo -e "${YELLOW}Selected models: $MODEL_TYPE${NC}"
echo ""

# ============================================================================
# MUSICGEN (Meta) - ~3.3GB
# ============================================================================
if [ "$MODEL_TYPE" == "all" ] || [ "$MODEL_TYPE" == "musicgen" ]; then
  echo -e "${PURPLE}=== MusicGen Models ===${NC}"
  echo "Size: ~3.3GB | VRAM: 8GB minimum"
  echo ""

  # MusicGen Large (best quality)
  download \
    "https://huggingface.co/facebook/musicgen-large/resolve/main/pytorch_model.bin" \
    "$MODELS_DIR/musicgen/musicgen-large.bin" \
    "MusicGen Large (3.3GB)"

  # MusicGen Medium (balanced)
  download \
    "https://huggingface.co/facebook/musicgen-medium/resolve/main/pytorch_model.bin" \
    "$MODELS_DIR/musicgen/musicgen-medium.bin" \
    "MusicGen Medium (1.5GB)"

  # MusicGen Melody (melody-conditioned)
  download \
    "https://huggingface.co/facebook/musicgen-melody/resolve/main/pytorch_model.bin" \
    "$MODELS_DIR/musicgen/musicgen-melody.bin" \
    "MusicGen Melody"

  echo ""
fi

# ============================================================================
# RVC v3 (Voice Cloning) - ~1.5GB base + models
# ============================================================================
if [ "$MODEL_TYPE" == "all" ] || [ "$MODEL_TYPE" == "rvc" ]; then
  echo -e "${PURPLE}=== RVC v3 Models ===${NC}"
  echo "Size: ~1.5GB base | VRAM: 4GB minimum"
  echo ""

  # RVC base models
  download \
    "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained_v2/f0D40k.pth" \
    "$MODELS_DIR/rvc/f0D40k.pth" \
    "RVC f0 Detection (40k)"

  download \
    "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained_v2/f0G40k.pth" \
    "$MODELS_DIR/rvc/f0G40k.pth" \
    "RVC Generator (40k)"

  download \
    "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt" \
    "$MODELS_DIR/rvc/hubert_base.pt" \
    "HuBERT Base"

  # RMVPE pitch extraction (best quality)
  download \
    "https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/rmvpe.pt" \
    "$MODELS_DIR/rvc/rmvpe.pt" \
    "RMVPE Pitch Model"

  echo ""
fi

# ============================================================================
# DEMUCS (Stem Separation) - ~800MB
# ============================================================================
if [ "$MODEL_TYPE" == "all" ] || [ "$MODEL_TYPE" == "demucs" ]; then
  echo -e "${PURPLE}=== Demucs Models ===${NC}"
  echo "Size: ~800MB | VRAM: 4GB minimum"
  echo ""

  # HTDemucs (best quality)
  download \
    "https://dl.fbaipublicfiles.com/demucs/hybrid_transformer/htdemucs.th" \
    "$MODELS_DIR/demucs/htdemucs.th" \
    "HTDemucs (4-stem)"

  # HTDemucs Fine-tuned (even better)
  download \
    "https://dl.fbaipublicfiles.com/demucs/hybrid_transformer/htdemucs_ft.th" \
    "$MODELS_DIR/demucs/htdemucs_ft.th" \
    "HTDemucs Fine-tuned"

  # HTDemucs 6-stem
  download \
    "https://dl.fbaipublicfiles.com/demucs/hybrid_transformer/htdemucs_6s.th" \
    "$MODELS_DIR/demucs/htdemucs_6s.th" \
    "HTDemucs 6-stem"

  echo ""
fi

# ============================================================================
# WHISPER (Speech Recognition) - ~3GB
# ============================================================================
if [ "$MODEL_TYPE" == "all" ] || [ "$MODEL_TYPE" == "whisper" ]; then
  echo -e "${PURPLE}=== Whisper Models ===${NC}"
  echo "Size: ~3GB | VRAM: 6GB minimum"
  echo ""

  # Whisper Large v3 (best quality)
  download \
    "https://openaipublic.azureedge.net/main/whisper/models/e5b1a55b89c1367dacf97e3e19bfd829/large-v3.pt" \
    "$MODELS_DIR/whisper/large-v3.pt" \
    "Whisper Large v3 (2.9GB)"

  # Whisper Medium (balanced)
  download \
    "https://openaipublic.azureedge.net/main/whisper/models/345ae4da62f9b3d59415adc60127b97c/medium.pt" \
    "$MODELS_DIR/whisper/medium.pt" \
    "Whisper Medium (1.5GB)"

  echo ""
fi

# ============================================================================
# COGVIDEO (Video Generation) - ~10GB
# ============================================================================
if [ "$MODEL_TYPE" == "all" ] || [ "$MODEL_TYPE" == "cogvideo" ]; then
  echo -e "${PURPLE}=== CogVideo Models ===${NC}"
  echo "Size: ~10GB | VRAM: 24GB recommended"
  echo -e "${YELLOW}Note: Large download, may take a while${NC}"
  echo ""

  echo -e "${BLUE}CogVideoX-5B requires manual download from Hugging Face${NC}"
  echo "Visit: https://huggingface.co/THUDM/CogVideoX-5b"
  echo "Place model files in: $MODELS_DIR/cogvideo/"
  echo ""
fi

# ============================================================================
# LIP SYNC (Wav2Lip/SadTalker) - ~500MB
# ============================================================================
if [ "$MODEL_TYPE" == "all" ] || [ "$MODEL_TYPE" == "lipsync" ]; then
  echo -e "${PURPLE}=== Lip Sync Models ===${NC}"
  echo "Size: ~500MB | VRAM: 4GB minimum"
  echo ""

  # Wav2Lip
  download \
    "https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/Eb3LEzbfuKlJiR600lQWRxgBIY27JZg80f7V9ber9N_Ggw?download=1" \
    "$MODELS_DIR/lipsync/wav2lip.pth" \
    "Wav2Lip"

  # Wav2Lip GAN (better quality)
  download \
    "https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/EdjI7bZlgApMqsVoEUUXpLsBxqXbn5z8VTmoxp55YNDcIA?download=1" \
    "$MODELS_DIR/lipsync/wav2lip_gan.pth" \
    "Wav2Lip GAN"

  echo ""
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "${GREEN}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                   DOWNLOAD COMPLETE!                          ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Calculate total size
TOTAL_SIZE=$(du -sh "$MODELS_DIR" 2>/dev/null | cut -f1)
echo -e "Total models size: ${GREEN}$TOTAL_SIZE${NC}"
echo ""

# List downloaded models
echo -e "${BLUE}Downloaded models:${NC}"
find "$MODELS_DIR" -type f -name "*.pt" -o -name "*.pth" -o -name "*.th" -o -name "*.bin" 2>/dev/null | while read -r file; do
  size=$(du -h "$file" | cut -f1)
  name=$(basename "$file")
  echo "  ✓ $name ($size)"
done

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  MUSICGEN_ENDPOINT=http://localhost:8001"
echo "  RVC_ENDPOINT=http://localhost:8002"
echo "  DEMUCS_ENDPOINT=http://localhost:8003"
echo "  WHISPER_ENDPOINT=http://localhost:8004"
echo "  COGVIDEO_ENDPOINT=http://localhost:8005"
echo "  LIPSYNC_ENDPOINT=http://localhost:8006"
echo ""

echo -e "${GREEN}vkTUNEos is ready for offline operation!${NC}"
echo -e "${PURPLE}Zero data collection. Your data stays yours.${NC}"
