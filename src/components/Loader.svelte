
<div class="card">
  <div class="loader">
    <p>loading</p>
    <div class="words">
      <span class="word">films</span>
      <span class="word">ratings</span>
      <span class="word">actors</span>
      <span class="word">profiles</span>
      <span class="word">trailers</span>
    </div>
  </div>
</div>


<style>
.card {
  padding: 1rem 2rem;
  border-radius: 1.25rem;
}
.loader {
  color: white;
  font-family: "Poppins", sans-serif;
  font-weight: 500;
  font-size: 25px;
  -webkit-box-sizing: content-box;
  box-sizing: content-box;
  height: 40px;
  padding: 10px 10px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  border-radius: 8px;
}

.words {
  overflow: hidden;
  position: relative;
}
.words::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 20;
}

.word {
  display: block;
  height: 100%;
  padding-left: 6px;
  color: #7a1cac;
  animation: spin_4991 4s infinite;
}

@keyframes spin_4991 {
  10% {
    -webkit-transform: translateY(-102%);
    transform: translateY(-102%);
  }

  25% {
    -webkit-transform: translateY(-100%);
    transform: translateY(-100%);
  }

  35% {
    -webkit-transform: translateY(-202%);
    transform: translateY(-202%);
  }

  50% {
    -webkit-transform: translateY(-200%);
    transform: translateY(-200%);
  }

  60% {
    -webkit-transform: translateY(-302%);
    transform: translateY(-302%);
  }

  75% {
    -webkit-transform: translateY(-300%);
    transform: translateY(-300%);
  }

  85% {
    -webkit-transform: translateY(-402%);
    transform: translateY(-402%);
  }

  100% {
    -webkit-transform: translateY(-400%);
    transform: translateY(-400%);
  }
}


</style>