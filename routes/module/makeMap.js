function xorshift32():
  y = y ^ (y &lt;&lt; 13)
  y = y ^ (y &gt;&gt; 17)
  y = y ^ (y &lt;&lt; 15)
  return y
