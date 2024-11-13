import "bootstrap/dist/css/bootstrap.min.css"
import "@fortawesome/fontawesome-free/css/all.min.css"
import "./style.css"
import "jquery"

type Review = {
   id: number
   movieTitle: string;
   rating: number;
   reviewText: string;
   comments: string; 
}



// Get elements from the DOM
const reviewForm = document.getElementById('reviewForm');
const reviewsList = document.getElementById('reviewsList');
const starRating = document.getElementById('starRating');
const ratingInput = document.getElementById('rating');
const editReviewForm = document.getElementById('editReviewForm');
const editStarRating = document.getElementById('editStarRating');
const editRatingInput = document.getElementById('editRating');
const editCommentForm = document.getElementById('editCommentForm');

let allCurrentReviews: Review[] = []
// Function to fetch and display reviews
async function fetchReviews() {
    try {
        const response = await fetch('http://localhost:3000/reviews');
        const reviews = await response.json();
        displayReviews(reviews);
        allCurrentReviews=reviews
    } catch (error) {
        console.error('Error fetching reviews:', error);
    }
}


function displayReviews(reviews: Review[]) {
    if (!reviewsList) return;
    reviewsList.innerHTML = ''; 
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'card review-card';
        reviewCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${review.movieTitle} (${review.rating} ${review.rating === 1 ? 'star' : 'stars'})</h5>
                <div class="mb-2">
                    ${generateStarIcons(review.rating)}
                </div>
                <p class="card-text">${review.reviewText}</p>
                <button class="btn btn-info" onclick="openEditModal('${review.id}', '${review.movieTitle}', '${review.rating}', '${encodeURIComponent(review.reviewText)}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteReview('${review.id}')">Delete</button>
                <h6>Comments:</h6>
                <div id="comments-${review.id}"></div>
                <form id="commentForm-${review.id}" onsubmit="addComment(event, '${review.id}')">
                    <div class="form-group">
                        <input type="text" id="commentText-${review.id}" class="form-control" placeholder="Add a comment" required>
                    </div>
                    <button type="submit" class="btn btn-secondary">Add Comment</button>
                </form>
            </div>
        `;
        reviewsList.appendChild(reviewCard);
        
        // Ensure comments array is initialized before displaying comments
        // Ensure comments array is initialized before displaying comments
review.comments = review.comments || [];
displayComments(review.comments, review.id);

    });

    //Delete all comments button after all comments have been set
    const deleteAllButton = document.createElement('button');
    deleteAllButton.id = 'deleteAllReviewsButton';
    deleteAllButton.className = 'btn btn-danger';
    deleteAllButton.innerText = 'Delete All Reviews';
    deleteAllButton.onclick = deleteAllReviews; 

    reviewsList.appendChild(deleteAllButton);
}


// Function to generate star icons for display
function generateStarIcons(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star star ${i <= rating ? 'selected' : ''}" data-value="${i}"></i>`;
    }
    return stars;
}

// Function to handle star rating selection for the new review
starRating.addEventListener('click', (event) => {
    if (event.target.classList.contains('star')) {
        const rating = event.target.getAttribute('data-value');
        setRating(rating);
    }
});

// Function to set the selected star rating
function setRating(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('selected');
        if (star.getAttribute('data-value') <= rating) {
            star.classList.add('selected');
        }
    });
    ratingInput.value = rating;
}

// Function to add a new review
reviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const movieTitle = document.getElementById('movieTitle').value;
    const reviewText = document.getElementById('reviewText').value;

    try {
        const response = await fetch('http://localhost:3000/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ movieTitle, rating: ratingInput.value, reviewText, comments: [] })
        });

        if (response.ok) {
            fetchReviews(); // Refresh the list of reviews
            reviewForm.reset(); // Reset the form
            setRating(0); // Reset the star rating
        } else {
            console.error('Error adding review:', response.statusText);
        }
    } catch (error) {
        console.error('Error adding review:', error);
    }
});


// Function to delete a review
async function deleteReview(id) {
    if (confirm("Are you sure you want to delete this review?")) {
        try {
            const response = await fetch(`http://localhost:3000/reviews/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchReviews(); // Refresh the list of reviews
            } else {
                console.error('Error deleting review:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    }
}

// Function to open edit modal and pre-fill the form
function openEditModal(id, movieTitle, rating, reviewText) {
    document.getElementById('editReviewId').value = id; // Set the review ID in the edit form
    document.getElementById('editMovieTitle').value = movieTitle; // Use the movie title directly
    document.getElementById('editReviewText').value = decodeURIComponent(reviewText); // Decode review text before displaying
    setEditRating(rating); // Set the rating in the edit form

    $('#editReviewModal').modal('show'); // Show the edit modal
}

// Function to set the selected star rating for the edit form
editStarRating.addEventListener('click', (event) => {
    if (event.target.classList.contains('star')) {
        const rating = event.target.getAttribute('data-value');
        setEditRating(rating);
    }
});

// Function to set the selected rating for the edit form
function setEditRating(rating) {
    const stars = editStarRating.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('selected');
        if (star.getAttribute('data-value') <= rating) {
            star.classList.add('selected');
        }
    });
    editRatingInput.value = rating; // Set the hidden input for the rating
}

// Function to handle saving the edited review
editReviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const id = document.getElementById('editReviewId').value;
    const movieTitle = document.getElementById('editMovieTitle').value;
    const reviewText = document.getElementById('editReviewText').value;

    try {
        const response = await fetch(`http://localhost:3000/reviews/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                movieTitle,
                rating: editRatingInput.value,
                reviewText
            })
        });

        if (response.ok) {
            fetchReviews(); // Refresh the list of reviews
            $('#editReviewModal').modal('hide'); // Hide the edit modal
        } else {
            console.error('Error updating review:', response.statusText);
        }
    } catch (error) {
        console.error('Error updating review:', error);
    }
});

function displayComments(comments, reviewId) {
    const commentsDiv = document.getElementById(`comments-${reviewId}`);
    commentsDiv.innerHTML = ''; // Clear existing comments
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment-container');
        commentElement.innerHTML = `
            <p>${comment.commentText}</p>
            <button class="btn btn-light" onclick="openEditCommentModal('${reviewId}', '${comment.id}', '${encodeURIComponent(comment.commentText)}')">
                Edit Comment
            </button>
            <button class="btn btn-danger" onclick="deleteComment('${reviewId}', '${comment.id}')">Delete</button>
            <button class="btn btn-light" onclick="likeComment(event, '${reviewId}', '${comment.id}')">
                <i class="fas fa-thumbs-up"></i> ${comment.likes || 0}
            </button>
            <button class="btn btn-light" onclick="dislikeComment(event, '${reviewId}', '${comment.id}')">
                <i class="fas fa-thumbs-down"></i> ${comment.dislikes || 0}
            </button>
        `;
        commentsDiv.appendChild(commentElement);
    });
    
    // Update the comment counter
    const commentCountElement = document.createElement('p');
    commentCountElement.innerText = `Total Comments: ${comments.length}`;
    commentsDiv.prepend(commentCountElement);
}


// Function to add a comment to a review
async function addComment(event, reviewId) {
    event.preventDefault(); // Prevent form submission

    const commentText = document.getElementById(`commentText-${reviewId}`).value; // Get comment text

    try {
        const response = await fetch(`http://localhost:3000/reviews/${reviewId}`);
        const review = await response.json();

        // Initialize comments if undefined
        review.comments = review.comments || []; 

        // Create the new comment object
        const newComment = { 
            id: Date.now().toString(), // Unique ID based on timestamp
            commentText, 
            likes: 0, 
            dislikes: 0 
        };

        // Add the new comment to the review
        review.comments.push(newComment);

        // Update the review with the new comment
        await fetch(`http://localhost:3000/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        });

        // Refresh the reviews display without affecting existing ratings
        fetchReviews();
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

async function deleteComment(reviewId, commentId) {
    if (confirm("Are you sure you want to delete this comment?")) {
        try {
            const response = await fetch(`http://localhost:3000/reviews/${reviewId}`);
            const review = await response.json();

            // Filter out the comment to delete
            review.comments = review.comments.filter(comment => comment.id !== commentId);

            // Update the review with the modified comments
            await fetch(`http://localhost:3000/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(review)
            });

            fetchReviews(); // Refresh the reviews display
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    }
}


// Function to like a comment
async function likeComment(event, reviewId, commentId) {
    event.preventDefault(); // Prevent default behavior

    try {
        const response = await fetch(`http://localhost:3000/reviews/${reviewId}`);
        const review = await response.json();

        // Find the comment by ID
        const comment = review.comments.find(c => c.id === commentId);
        if (comment) {
            comment.likes = (comment.likes || 0) + 1; // Increment likes
        }

        // Update the review with the new likes
        await fetch(`http://localhost:3000/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        });

        fetchReviews();
    } catch (error) {
        console.error('Error liking comment:', error);
    }
}

// Function to dislike a comment
async function dislikeComment(event, reviewId, commentId) {
    event.preventDefault(); // Prevent default behavior

    try {
        const response = await fetch(`http://localhost:3000/reviews/${reviewId}`);
        const review = await response.json();

        // Find the comment by ID
        const comment = review.comments.find(c => c.id === commentId);
        if (comment) {
            comment.dislikes = (comment.dislikes || 0) + 1; // Increment dislikes
        }

        // Update the review with the new dislikes
        await fetch(`http://localhost:3000/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        });

        fetchReviews();
    } catch (error) {
        console.error('Error disliking comment:', error);
    }
}

// Function to open edit comment modal
function openEditCommentModal(reviewId, commentId, commentText) {
    document.getElementById('editCommentId').value = commentId; // Set the comment ID in the edit form
    document.getElementById('editCommentReviewId').value = reviewId; // Set the review ID for the comment
    document.getElementById('editCommentText').value = decodeURIComponent(commentText); // Decode comment text before displaying

    $('#editCommentModal').modal('show'); // Show the edit comment modal
}

// Function to handle saving the edited comment
editCommentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Access the IDs after ensuring the modal is opened and the elements exist
    const commentId = document.getElementById('editCommentId').value; // Comment ID
    const reviewId = document.getElementById('editCommentReviewId').value; // Review ID

    // Check if the elements are found
    if (!commentId || !reviewId) {
        console.error("Comment ID or Review ID is missing!");
        return; // Prevent further execution
    }

    const commentText = document.getElementById('editCommentText').value; // Comment text

    try {
        const response = await fetch(`http://localhost:3000/reviews/${reviewId}`);
        const review = await response.json();

        // Find the comment to edit
        const comment = review.comments.find(c => c.id === commentId);
        if (comment) {
            comment.commentText = commentText; // Update the comment text
        }

        // Update the review with the modified comment
        await fetch(`http://localhost:3000/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        });

        fetchReviews(); // Refresh the reviews display
        $('#editCommentModal').modal('hide'); // Hide the edit comment modal
    } catch (error) {-
        console.error('Error editing comment:', error);
    }
});
// Function to delete all reviews
async function deleteAllReviews() {
    if (confirm("Are you sure you want to delete all reviews?")) {
        try {
            /* added for loop to loop over eeach item in the array then added the await fetch request to delete each review with the corresponding id*/
            for( item of allCurrentReviews){
            const response = await fetch(`http://localhost:3000/reviews/${item.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchReviews(); // Refresh the list of reviews
            } else {
                console.error('Error deleting all reviews:', response.statusText);
            }
        }
        } catch (error) {
            console.error('Error deleting all reviews:', error);
        }
    }
    
}



// Fetch reviews when the page loads
document.addEventListener('DOMContentLoaded', fetchReviews);
