// Import jQuery and Bootstrap
import $ from "jquery"; // Import jQuery
import "bootstrap/dist/js/bootstrap.bundle"; // Bootstrap JS (including Popper.js)
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap CSS
import { Modal } from "bootstrap";

import "@fortawesome/fontawesome-free/css/all.min.css"; // Font Awesome CSS
import "./style.css"; // Custom styles

type Review = {
  id: number;
  movieTitle: string;
  rating: number;
  reviewText: string;
  comments: any[]; // Consider defining a specific Comment type if applicable
};

type Comment = {
  id: string;
  commentText: string;
  likes: number;
  dislikes: number;
};


// Get elements from the DOM and assert types
const reviewForm = document.getElementById("reviewForm") as HTMLFormElement;
const reviewsList = document.getElementById("reviewsList") as HTMLElement;
const starRating = document.getElementById("starRating") as HTMLElement;
const ratingInput = document.getElementById("rating") as HTMLInputElement;
const editReviewForm = document.getElementById(
  "editReviewForm"
) as HTMLInputElement;
const editStarRating = document.getElementById("editStarRating") as HTMLElement;
const editRatingInput = document.getElementById(
  "editRating"
) as HTMLInputElement;

const reviews: Review[] = [];

let allCurrentReviews: Review[] = [];

async function addReview(review: Review) {
  const response = await fetch("http://localhost:3000/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    throw new Error("Failed to add review");
  }

  // Optionally, you can fetch the updated list of reviews:
  await fetchReviews(); // This will update the UI with the new review
}
async function handleAddReview(event: Event) {
  event.preventDefault(); // Prevent default form submission

  // Extract the review details from the form
  const movieTitle = (
    document.getElementById("movie-title") as HTMLInputElement
  ).value;
  const rating = parseInt(
    (document.getElementById("rating") as HTMLInputElement).value
  );
  const reviewText = (
    document.getElementById("review-text") as HTMLTextAreaElement
  ).value;

  const newReview: Review = {
    id: Date.now(), // This will be replaced with the ID from the server if needed
    movieTitle,
    rating,
    reviewText,
    comments: [],
  };

  try {
    await addReview(newReview); // Call the addReview function to add it to the database
    (document.getElementById("review-form") as HTMLFormElement).reset(); // Reset the form after submission
  } catch (error) {
    console.error("Error adding review:", error);
  }
}

async function fetchReviews() {
  try {
    const response = await fetch("http://localhost:3000/reviews");
    const fetchedReviews: Review[] = await response.json();
    allCurrentReviews = fetchedReviews; // Store fetched reviews for later use
    reviews.length = 0; // Clear the existing reviews
    reviews.push(...fetchedReviews); // Use spread operator to push reviews into the array
    displayReviews(); // Call displayReviews to update the UI
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }
}

function displayReviews() {
  if (!reviewsList) return; // Guard clause to check if reviewsList is not null
  reviewsList.innerHTML = ""; // Clear existing reviews

  reviews.forEach((review) => {
    const reviewCard = document.createElement("div");
    reviewCard.className = "card review-card";
    reviewCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${review.movieTitle} (${review.rating} ${
      review.rating === 1 ? "star" : "stars"
    })</h5>
                <div class="mb-2">
                    ${generateStarIcons(review.rating)}
                </div>
                <p class="card-text">${review.reviewText}</p>
                <button class="btn btn-info" id="edit-button-${
                  review.id
                }">Edit</button>
                <button class="btn btn-danger" id="delete-button-${
                  review.id
                }">Delete</button>
                <h6>Comments:</h6>
                <div id="comments-${review.id}"></div>
                <form id="commentForm-${
                  review.id
                }" onsubmit="addComment(event, ${review.id})">
                    <div class="form-group">
                        <input type="text" id="commentText-${
                          review.id
                        }" class="form-control" placeholder="Add a comment" required>
                    </div>
                    <button type="button" class="btn btn-warning" id="add-comment-button-${
                  review.id
                }">Add Comment</button>
                </form>
            </div>
        `;
    reviewsList.appendChild(reviewCard);
    // Event listener for form submission
    document.addEventListener("DOMContentLoaded", () => {
      const reviewForm = document.getElementById(
        "review-form"
      ) as HTMLFormElement;
      reviewForm.addEventListener("submit", handleAddReview); // Attach the submit event
      fetchReviews(); // Fetch existing reviews when the page loads
    });
    // Ensure comments array is initialized before displaying comments
    review.comments = review.comments || [];
    displayComments(review.comments, review.id.toString());

    // Add event listeners for the Edit and Delete buttons
    const editButton = document.getElementById(`edit-button-${review.id}`);
    const deleteButton = document.getElementById(`delete-button-${review.id}`);
    const addCommentButton = document.getElementById(`add-comment-button-${review.id}`)
    

    if (editButton) {
      editButton.addEventListener("click", () =>
        openEditModal(
          review.id,
          review.movieTitle,
          review.rating,
          encodeURIComponent(review.reviewText)
        )
      );
    }

    if (deleteButton) {
      deleteButton.addEventListener("click", () => deleteReview(review.id));
    }

    if (addCommentButton) {
        addCommentButton.addEventListener("click", (event) => addComment(event,review.id));
      }
      document.querySelectorAll(".editCommentModal").forEach((button) => {
  button.addEventListener("click", () => {
    const { reviewId, commentId, commentText } = (button as HTMLElement).dataset;
    if (reviewId && commentId && commentText) openEditCommentModal(reviewId, commentId, commentText);
  });
});

  });

  // Delete all comments button after all comments have been set
  const deleteAllButton = document.createElement("button");
  deleteAllButton.id = "deleteAllReviewsButton";
  deleteAllButton.className = "btn btn-danger";
  deleteAllButton.innerText = "Delete All Reviews";
  deleteAllButton.onclick = deleteAllReviews;

  reviewsList.appendChild(deleteAllButton);
}

// Function to generate star icons for display
function generateStarIcons(rating: number) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="fas fa-star star ${
      i <= rating ? "selected" : ""
    }" data-value="${i}"></i>`;
  }
  return stars;
}

// Function to handle star rating selection for the new review
starRating?.addEventListener("click", (event) => {
  if ((event.target as HTMLElement).classList.contains("star")) {
    const target = event.target as HTMLElement;
    const rating = target.getAttribute("data-value");
    const ratingNumber = rating ? parseInt(rating, 10) : null;

    if (ratingNumber !== null && !isNaN(ratingNumber)) {
      setRating(ratingNumber);
    } else {
      console.error("Invalid rating value:", rating);
    }
  }
});

// Function to set the selected star rating
function setRating(rating: number) {
  const stars = document.querySelectorAll<HTMLElement>(".star");
  stars.forEach((star) => {
    star.classList.remove("selected");
    const starValue = star.getAttribute("data-value");
    if (starValue !== null) {
      const starRatingValue = parseInt(starValue, 10);
      if (starRatingValue <= rating) {
        star.classList.add("selected");
      }
    }
  });

  const ratingInputElement = ratingInput as HTMLInputElement; // Ensure ratingInput is not null
  ratingInputElement.value = rating.toString();
}

// Ensure reviewForm is not null before adding the event listener
if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const movieTitleElement = document.getElementById(
      "movieTitle"
    ) as HTMLInputElement | null;
    const reviewTextElement = document.getElementById(
      "reviewText"
    ) as HTMLTextAreaElement | null;
    const ratingInputElement = document.getElementById(
      "rating"
    ) as HTMLInputElement | null;

    if (movieTitleElement && reviewTextElement && ratingInputElement) {
      const movieTitle = movieTitleElement.value; // Declare movieTitle
      const reviewText = reviewTextElement.value; // Declare reviewText
      const rating = parseInt(ratingInputElement.value, 10); // Parse the rating value

      const requestBody = JSON.stringify({
        movieTitle,
        rating,
        reviewText,
        comments: [],
      });
      console.log(requestBody);

      try {
        const response = await fetch("http://localhost:3000/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody, // Use the constructed requestBody
        });

        if (response.ok) {
          fetchReviews(); // Refresh the list of reviews
          reviewForm.reset(); // Reset the form
          setRating(0); // Reset the star rating
        } else {
          console.error("Error adding review:", response.statusText);
        }
      } catch (error) {
        console.error("Error adding review:", error);
      }
    } else {
      console.error("One or more elements are null.");
    }
  });
}

// Function to delete a review
async function deleteReview(id: number) {
  if (confirm("Are you sure you want to delete this review?")) {
    try {
      const response = await fetch(`http://localhost:3000/reviews/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchReviews(); // Refresh the list of reviews
      } else {
        console.error("Error deleting review:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  }
}

// Fetch initial reviews on load
fetchReviews();

// Function to open the edit modal
function openEditModal(
  id: number,
  movieTitle: string,
  rating: number,
  reviewText: string
) {
  const modalElement = document.getElementById("editReviewModal");
  if (modalElement) {
    const editReviewId = document.getElementById(
      "editReviewId"
    ) as HTMLInputElement | null;
    const editMovieTitle = document.getElementById(
      "editMovieTitle"
    ) as HTMLInputElement | null;
    const editReviewText = document.getElementById(
      "editReviewText"
    ) as HTMLTextAreaElement | null;

    if (editReviewId && editMovieTitle && editReviewText) {
      // Pre-fill the form fields
      editReviewId.value = id.toString();
      editMovieTitle.value = movieTitle;
      editReviewText.value = decodeURIComponent(reviewText);
      setEditRating(rating);

      // Show the modal using Bootstrap's Modal class
      const modalInstance = new Modal(modalElement);
      modalInstance.show();
    } else {
      console.error("One or more elements not found.");
    }
  }
}

if (editStarRating) {
  // Function to set the selected star rating for the edit form
  editStarRating.addEventListener("click", (event) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.classList.contains("star")
    ) {
      const rating = event.target.getAttribute("data-value");
      if (rating) {
        setEditRating(Number(rating));
      }
    }
  });
}

// Function to set the selected rating for the edit form
function setEditRating(rating: number) {
  const stars = editStarRating?.querySelectorAll(".star") || []; // Check if editStarRating is not null
  stars.forEach((star) => {
    star.classList.remove("selected");
    if (star.getAttribute("data-value") === rating.toString()) {
      star.classList.add("selected");
    }
  });

  const editRatingInput = document.getElementById(
    "editRating"
  ) as HTMLInputElement | null; // Ensure the element is not null
  if (editRatingInput) {
    editRatingInput.value = rating.toString(); // Set the hidden input for the rating
  }
}

if (editReviewForm) {
  // Function to handle saving the edited review
  editReviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById(
      "editReviewId"
    ) as HTMLInputElement | null;
    const movieTitle = document.getElementById(
      "editMovieTitle"
    ) as HTMLInputElement | null;
    const reviewText = document.getElementById(
      "editReviewText"
    ) as HTMLTextAreaElement | null;

    if (id && movieTitle && reviewText) {
      try {
        const response = await fetch(
          `http://localhost:3000/reviews/${id.value}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              movieTitle: movieTitle.value,
              rating: Number(editRatingInput?.value),
              reviewText: reviewText.value,
            }),
          }
        );

        if (response.ok) {
          fetchReviews(); // Refresh the list of reviews

          // Hide the edit modal using Bootstrap’s Modal class
          const modalElement = document.getElementById("editReviewModal");
          if (modalElement) {
            const modalInstance =
              Modal.getInstance(modalElement) || new Modal(modalElement);
            modalInstance.hide();
          }
        } else {
          console.error("Error updating review:", response.statusText);
        }
      } catch (error) {
        console.error("Error updating review:", error);
      }
    }
  });
}

// Add a comment to a review
async function addComment(event: Event, reviewId: string) {
    console.log("Adding a comment...:",event,"Review ID:", reviewId);
    
    event.preventDefault();
  
    const commentInput = document.getElementById(
      `commentText-${reviewId}`
    ) as HTMLInputElement | null;
  
    if (commentInput && commentInput.value.trim() !== "") {
      try {
        // Step 1: Fetch the existing review
        const response = await fetch(`http://localhost:3000/reviews/${reviewId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch the review.");
        }
        const review = await response.json();
  
        // Step 2: Add the new comment
        const newComment = {
          id: Date.now().toString(),
          commentText: commentInput.value,
          likes: 0,
          dislikes: 0,
        };
        review.comments = review.comments || []; // Initialize if undefined
        review.comments.push(newComment);
  
        // Step 3: Update the review on the server
        const updateResponse = await fetch(
          `http://localhost:3000/reviews/${reviewId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(review),
          }
        );
  
        if (updateResponse.ok) {
          commentInput.value = ""; // Clear the input
          await fetchReviews(); // Refresh the reviews list to show the new comment
        } else {
          console.error("Failed to update the review with the new comment");
        }
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    } else {
      console.error("Comment text is empty or undefined");
    }
  }
  
  // Function to display comments for a review
  function displayComments(comments: Comment[], reviewId: string) {
    const commentsDiv = document.getElementById(
      `comments-${reviewId}`
    ) as HTMLElement | null;
    if (commentsDiv) {
      commentsDiv.innerHTML = ""; // Clear existing comments
      comments.forEach((comment) => {
        const commentElement = document.createElement("div");
        commentElement.classList.add("comment-container");
        commentElement.innerHTML = `
                  <p>${comment.commentText}</p>
                  <button type="button" class="btn btn-light" id=edit-comment-button onclick="openEditCommentModal('${reviewId}', '${comment.id}', '${encodeURIComponent(comment.commentText)}')">
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
      const commentCountElement = document.createElement("p");
      commentCountElement.innerText = `Total Comments: ${comments.length}`;
      commentsDiv.prepend(commentCountElement);
    }
  }
  
  // Ensure comment forms are being set up correctly on page load
  document.addEventListener("DOMContentLoaded", () => {
    const commentForms = document.querySelectorAll("form[id^='commentForm-']");
    commentForms.forEach((form) => {
      const reviewId = form.id.split('-')[1];
      form.addEventListener("submit", (event) => addComment(event, reviewId));
    });
  });
  
  // Event listener for saving edited comment
  
  document.getElementById("editCommentForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
   
      const editCommentId = (document.getElementById("editCommentId") as HTMLInputElement).value;
      const editCommentReviewId = (document.getElementById("editCommentReviewId") as HTMLInputElement).value;
      const editCommentText = (document.getElementById("editCommentText") as HTMLTextAreaElement).value;
  
      try {
          // Step 1: Fetch the existing review
          const response = await fetch(`http://localhost:3000/reviews/${editCommentReviewId}`);
          if (!response.ok) {
              throw new Error("Failed to fetch the review.");
          }
          const review = await response.json();
  
          // Step 2: Update the comment
          const commentIndex = review.comments.findIndex((comment: { id: string; }) => comment.id === editCommentId);
          if (commentIndex !== -1) {
              review.comments[commentIndex].commentText = editCommentText;
  
              // Step 3: Update the review on the server
              const updateResponse = await fetch(`http://localhost:3000/reviews/${editCommentReviewId}`, {
                  method: "PUT",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify(review),
              });
  
              if (updateResponse.ok) {
                  await fetchReviews(); // Refresh the reviews list to show the updated comment
                  const editCommentModal = document.getElementById("editCommentModal") as HTMLElement | null;
                  if (editCommentModal) {
                      $(editCommentModal).modal('hide'); // Hide the modal
                  }
              } else {
                  console.error("Failed to update the comment");
              }
          }
      } catch (error) {
          console.error("Error editing comment:", error);
      }
  });
  





// Fetch reviews on page load
document.addEventListener("DOMContentLoaded", fetchReviews);

// Event listener for submitting comment forms
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("form[id^='commentForm-']").forEach((form) => {
    const reviewId = form.id.split('-')[1];
    form.addEventListener("submit", (event) => addComment(event, reviewId));
  });

  // Event listeners for liking and disliking comments
  document.querySelectorAll(".like-comment-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const { reviewId, commentId } = (button as HTMLElement).dataset;
      if (reviewId && commentId) likeComment(event, reviewId, commentId);
    });
  });

  document.querySelectorAll(".dislike-comment-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const { reviewId, commentId } = (button as HTMLElement).dataset;
      if (reviewId && commentId) dislikeComment(event, reviewId, commentId);
    });
  });

  // Event listener for opening the edit comment modal
  document.querySelectorAll(".editCommentModal").forEach((button) => {
    button.addEventListener("click", () => {
      const { reviewId, commentId, commentText } = (button as HTMLElement).dataset;
      if (reviewId && commentId && commentText) openEditCommentModal(reviewId, commentId, commentText);
    });
  });

  // Event listener for saving edited comment
  const editCommentForm = document.getElementById("editCommentForm") as HTMLFormElement | null;
  if (editCommentForm) {
    editCommentForm.addEventListener("submit", saveEditedComment);
  }
});

// Function to save edited comment
async function saveEditedComment(event: Event) {
  event.preventDefault();

  const editCommentId = (document.getElementById("editCommentId") as HTMLInputElement).value;
  const editCommentReviewId = (document.getElementById("editCommentReviewId") as HTMLInputElement).value;
  const editCommentText = (document.getElementById("editCommentText") as HTMLTextAreaElement).value;

  try {
    const response = await fetch(`http://localhost:3000/reviews/${editCommentReviewId}`);
    if (!response.ok) throw new Error("Failed to fetch the review.");
    const review = await response.json();

    const commentIndex = review.comments.findIndex((comment: { id: string; }) => comment.id === editCommentId);
    if (commentIndex !== -1) {
      review.comments[commentIndex].commentText = editCommentText;

      const updateResponse = await fetch(`http://localhost:3000/reviews/${editCommentReviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
      });

      if (updateResponse.ok) {
        await fetchReviews(); // Refresh the reviews list to show the updated comment
        const editCommentModal = document.getElementById("editCommentModal") as HTMLElement | null;
        if (editCommentModal) $(editCommentModal).modal('hide'); // Hide the modal
      } else {
        console.error("Failed to update the comment");
      }
    }
  } catch (error) {
    console.error("Error editing comment:", error);
  }
}

// Function to open the edit comment modal
function openEditCommentModal(reviewId: string, commentId: string, commentText: string) {
  const editCommentModal = document.getElementById("editCommentModal") as HTMLElement | null;
  const editCommentText = document.getElementById("editCommentText") as HTMLTextAreaElement | null;
  const editCommentId = document.getElementById("editCommentId") as HTMLInputElement | null;
  const editCommentReviewId = document.getElementById("editCommentReviewId") as HTMLInputElement | null;

  if (editCommentModal && editCommentText && editCommentId && editCommentReviewId) {
    editCommentText.value = decodeURIComponent(commentText);
    editCommentId.value = commentId;
    editCommentReviewId.value = reviewId;
    $(editCommentModal).modal("show");
  }
}

// Function to delete all reviews
async function deleteAllReviews(): Promise<void> {
  if (confirm("Are you sure you want to delete all reviews?")) {
    try {
      await Promise.all(allCurrentReviews.map(async (item) => {
        const response = await fetch(`http://localhost:3000/reviews/${item.id}`, { method: "DELETE" });
        if (!response.ok) console.error("Error deleting review:", response.statusText);
      }));
      await fetchReviews(); // Refresh the list of reviews
    } catch (error) {
      console.error("Error deleting all reviews:", error);
    }
  }
}

// Function to like a comment
async function likeComment(event: Event, reviewId: string, commentId: string): Promise<void> {
  event.preventDefault();
  await updateCommentLikeDislike(reviewId, commentId, "likes");
}

// Function to dislike a comment
async function dislikeComment(event: Event, reviewId: string, commentId: string): Promise<void> {
  event.preventDefault();
  await updateCommentLikeDislike(reviewId, commentId, "dislikes");
}

// Function to update likes/dislikes for a comment
async function updateCommentLikeDislike(reviewId: string, commentId: string, type: 'likes' | 'dislikes') {
  try {
    const response = await fetch(`http://localhost:3000/reviews/${reviewId}`);
    const review = await response.json();

    const comment = review.comments.find((c: { id: string }) => c.id === commentId);
    if (comment) {
      comment[type] = (comment[type] || 0) + 1;

      await fetch(`http://localhost:3000/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
      });
      fetchReviews();
    }
  } catch (error) {
    console.error(`Error ${type === 'likes' ? 'liking' : 'disliking'} comment:`, error);
  }
}

