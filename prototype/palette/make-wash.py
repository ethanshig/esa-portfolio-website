# PROTOTYPE: make the site's wash ground from Ethan's watercolour (IMG_7650), and measure its palette.
import sys, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
im = cv2.imread(src)                       # 4032x3024, paper on a green mat
s = 4032 / 1600
x0, y0, x1, y1 = [int(v * s) for v in (95, 85, 1475, 1105)]
im = im[y0:y1, x0:x1]
lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB)
L = lab[..., 0]
# the pen line: dark, thin. Mask it and paint it out so only washes, drips and stipple remain
ink = (L < 95).astype(np.uint8) * 255
ink = cv2.dilate(ink, np.ones((5, 5), np.uint8))
washonly = cv2.inpaint(im, ink, 7, cv2.INPAINT_TELEA)
# even out the photo's lighting: divide by a heavy blur of the paper, so the paper reads flat
bg = cv2.GaussianBlur(cv2.morphologyEx(washonly, cv2.MORPH_CLOSE, np.ones((61, 61), np.uint8)), (0, 0), 120)
flat = np.clip(washonly.astype(np.float32) / np.maximum(bg.astype(np.float32), 1) * 236, 0, 255).astype(np.uint8)
small = cv2.resize(flat, (1600, int(1600 * flat.shape[0] / flat.shape[1])), interpolation=cv2.INTER_AREA)
cv2.imwrite(out + '/wash.jpg', small, [cv2.IMWRITE_JPEG_QUALITY, 72])
cv2.imwrite(out + '/inkmask.png', cv2.resize(ink, (800, int(800 * ink.shape[0] / ink.shape[1]))))
# palette: k-means on the unflattened crop in Lab
px = cv2.resize(im, (300, 222)).reshape(-1, 3).astype(np.float32)
_, lbl, ctr = cv2.kmeans(px, 8, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.5), 5, cv2.KMEANS_PP_CENTERS)
cnt = np.bincount(lbl.ravel(), minlength=8)
for i in np.argsort(-cnt):
    b, g, r = ctr[i]; print(f'#{int(r):02x}{int(g):02x}{int(b):02x} {cnt[i]/cnt.sum()*100:4.1f}%')
dark = im.reshape(-1, 3)[(L.ravel() < 60)]
b, g, r = dark.mean(0); print(f'ink #{int(r):02x}{int(g):02x}{int(b):02x}')
