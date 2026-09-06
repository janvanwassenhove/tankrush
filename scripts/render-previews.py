"""Offline depth-buffer rasterizer for the actual TankRush scene geometry."""
import json,sys,os
import numpy as np
from PIL import Image
w,h=1200,800
pixels=np.full((h,w,3),(35,48,51),dtype=np.uint8)
depth=np.full((h,w),np.inf,dtype=np.float32)
for _,coords,color in json.load(open(sys.argv[1])):
    t=np.array(coords).reshape(3,3)
    x0,y0=max(0,int(t[:,0].min())),max(0,int(t[:,1].min()))
    x1,y1=min(w-1,int(t[:,0].max())),min(h-1,int(t[:,1].max()))
    if x1<x0 or y1<y0:continue
    a,b,c=t
    denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(denominator)<.01:continue
    yy,xx=np.mgrid[y0:y1+1,x0:x1+1]
    u=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/denominator
    v=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/denominator
    z=u*a[2]+v*b[2]+(1-u-v)*c[2]
    region=depth[y0:y1+1,x0:x1+1]
    mask=(u>=0)&(v>=0)&(u+v<=1)&(z<region)
    region[mask]=z[mask]
    pixels[y0:y1+1,x0:x1+1][mask]=color
Image.fromarray(pixels).save(sys.argv[2],'WEBP',quality=82,method=6)
print(f'{os.path.getsize(sys.argv[2])//1024} KB')
