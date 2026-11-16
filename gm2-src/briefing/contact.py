import sys
from PIL import Image
k=sys.argv[1]; dev=sys.argv[2] if len(sys.argv)>2 else 'mac'
n=['s0','s2','s3','s4','s5','s6','act-buy','act-auc','act-grow','act-bureau','card','mode']
ims=[Image.open(f'{k}-{dev}-{x}.png').resize((720,450)) for x in n]
c=Image.new('RGB',(1440,450*6),'white')
for j,i in enumerate(ims): c.paste(i,((j%2)*720,(j//2)*450))
c.save(f'{k}-contact.png')
