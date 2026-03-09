@API @CRUD @Acceptance
# Priority: High
# Technique: Full CRUD lifecycle verification
#
# Validates that the Review resource supports Create, Read, Update and Delete
# operations with correct HTTP status codes and response bodies.
#
# Lifecycle:
#   POST   /api/hotel/321/reviews          → 201 Created   (C)
#   GET    /api/hotel/321/reviews/{id}     → 200 OK        (R)
#   PUT    /api/hotel/321/reviews/{id}     → 200 OK        (U)
#   DELETE /api/hotel/321/reviews/{id}     → 204 No Content(D)
#   GET    /api/hotel/321/reviews/{id}     → 404 Not Found (verify D)
Feature: Hotel Review – Full CRUD Lifecycle
  As a QA engineer
  I want to verify every CRUD operation on the Review resource
  So that data integrity is guaranteed end-to-end

  Scenario: Create a new review (C)
    When I create a review for hotel 321 with rating 5 and comment "Exceptional service and location"
    Then the response status should be 201
    And the review should be created successfully

  Scenario: Read the created review (R)
    Given a review exists for hotel 321
    When I retrieve the review by id
    Then the response status should be 200
    And the review should contain rating 5 and comment "Exceptional service and location"

  Scenario: Update the review (U)
    Given a review exists for hotel 321
    When I update the review to rating 4 and comment "Great stay, minor noise issues"
    Then the response status should be 200
    And the review should contain rating 4 and comment "Great stay, minor noise issues"

  Scenario: Delete the review (D)
    Given a review exists for hotel 321
    When I delete the review
    Then the response status should be 204

  Scenario: Verify deleted review returns 404 (verify D)
    Given a review has been deleted for hotel 321
    When I retrieve the review by id
    Then the response status should be 404

  @CRUD-Negative
  Scenario: Create review with invalid rating is rejected
    When I create a review for hotel 321 with rating 6 and comment "Out of scale"
    Then the response status should be 422
    And the response should contain field "error"

  @CRUD-Negative
  Scenario: Update non-existent review returns 404
    When I update review 99999 for hotel 321 to rating 3 and comment "Does not exist"
    Then the response status should be 404
