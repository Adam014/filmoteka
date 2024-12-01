movie/id
    TODO: Add more details to MovieCard = reviews
    TODO: Add recommendations
    TODO: Add Watch providers, where you can watch the movies
    TODO: Add release dates https://api.themoviedb.org/3/movie/{movie_id}/release_dates
    TODO: When trailer is not showing we need to atleast show the poster 

/root
    TODO: Need to somehow get who is the admin and then have different layouts rendered based on the role etc
    TODO: Limit pagination when user isnt logged in to 3 pages and disable t;he ability to search, he can view only the movies that are in in the 3 pages, block navigation when user tries to view some movie that isnt in the first 3 pages
    TODO: Add categories to /
    TODO: Add with other api endpoint to store a lot more movies than few thousand
    TODO: Create a skeleton for the library route
    TODO: Move library to /library and make proper homepage, with top 5 movies something like that and etc, recent reviews 
        TODO: Add release and features somewhere to let the user know what is new in what version

/profile
    TODO: Add personalized movies you might like, based on favorite movies (probably with AI picking the personalized movies)

/games/daily
    TODO: Add first game, that will be Daily Challenge, every day we add random but popular movie and its backdrop_path (image), the image will be on the first look super pixelized and user will have 3 tries, and each skipped try or wrong guess it will be less and less pixelized
    - every hint will be thumbnail + some info
    - 1. hint - pixalized thumbnail + release date
    - 2. hint - less pixalized + tags
    - 3. hint - top 3 actors from credits