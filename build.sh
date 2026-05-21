#!/bin/bash
# 掃描 images/ 資料夾，產生 images.json
# 用法：./build.sh

cd "$(dirname "$0")"

if [ ! -d "images" ]; then
  echo "找不到 images/ 資料夾"
  exit 1
fi

JSON="images.json"

echo "{"  > "$JSON"
echo '  "generated": "'"$(date +%Y-%m-%dT%H:%M:%S)"'",' >> "$JSON"
echo '  "images": [' >> "$JSON"

count=0
first=1
# 支援常見圖片格式，依檔名自然排序（1, 2, ..., 10, 11）
for f in $(ls "images/" 2>/dev/null | grep -iE '\.(jpg|jpeg|png|gif|webp|svg|avif|heic)$' | sort -V); do
  name="${f%.*}"
  if [ $first -eq 1 ]; then
    first=0
  else
    echo "," >> "$JSON"
  fi
  printf '    { "file": "%s", "name": "%s" }' "$f" "$name" >> "$JSON"
  count=$((count + 1))
done

echo "" >> "$JSON"
echo "  ]" >> "$JSON"
echo "}" >> "$JSON"

# 清掉 macOS 的 .DS_Store，避免被 git 追蹤
find . -name ".DS_Store" -not -path "./.git/*" -delete 2>/dev/null

echo "已掃描 $count 張圖片，產生 $JSON"
echo "下一步：git add -A && git commit -m \"...\" && git push"
