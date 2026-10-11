"""Independent re-computation of the example traverse (3 methods) and level book, compared with the JS engine."""
import json, math, subprocess, sys
js = json.loads(subprocess.check_output(['node', '-e', '''
import("./src/core.js").then(async C => { const X = await import("./src/example.js");
 const o = {}; for (const m of ["bowditch","transit","equal"]) o[m] = C.computeTraverse({...X.EXAMPLE_TRAVERSE, method:m}).points.map(p=>[p.E,p.N]);
 o.level = C.computeLevel(X.EXAMPLE_LEVEL).rows.map(r=>[r.rl,r.adjRL]); console.log(JSON.stringify(o)); })''']))
st=(228450.312,441203.845); pts=[(228610.458,441118.300),(228795.123,441090.770),(228968.548,441162.410),(229120.243,441281.652)]
known=(229265.871,441392.006); meas=(229265.883,441391.997)
chain=[st]+pts+[meas]; dE=meas[0]-known[0]; dN=meas[1]-known[1]
legs=[(chain[i][0]-chain[i-1][0], chain[i][1]-chain[i-1][1]) for i in range(1,len(chain))]
def adj(wE, wN):
    out=[st]; cE=cN=0; TE=sum(wE); TN=sum(wN)
    for i,(a,b) in enumerate(legs):
        cE+=wE[i]; cN+=wN[i]; p=chain[i+1]; out.append((p[0]-dE*cE/TE, p[1]-dN*cN/TN))
    return out
ref={'bowditch':adj([math.hypot(a,b) for a,b in legs],[math.hypot(a,b) for a,b in legs]),
     'transit':adj([abs(a) for a,b in legs],[abs(b) for a,b in legs]),
     'equal':adj([1]*len(legs),[1]*len(legs))}
worst=0
for m in ref:
    for (e1,n1),(e2,n2) in zip(ref[m], js[m]): worst=max(worst,abs(e1-e2),abs(n1-n2))
# level by Rise & Fall, independent
rows=[(1.512,None,None),(1.388,None,0.866),(None,2.034,None),(1.604,None,0.801),(None,None,2.839)]
rl=[4.215]; prev=1.512; setup=[0]; s=1
for bs,is_,fs in rows[1:]:
    r= is_ if is_ is not None else fs; rl.append(rl[-1]+prev-r); setup.append(s)
    if bs is not None: prev=bs; s+=1
    else: prev=r
mis=rl[-1]-4.215; n=s
adjrl=[x - mis*k/n for x,k in zip(rl,setup)]
for (a,b),(c,d) in zip(zip(rl,adjrl), js['level']): worst=max(worst,abs(a-c),abs(b-d))
print('max difference JS vs independent (m):', worst); sys.exit(0 if worst<1e-9 else 1)
