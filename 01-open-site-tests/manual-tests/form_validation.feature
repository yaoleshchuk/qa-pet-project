@Regression
# Priority: Low
Feature: Contact Form Validation

  Scenario: User submits empty contact form
    Given I am on the contact page
    When I click the submit button without filling any field
    Then I should see validation errors for required fields
