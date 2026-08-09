# Escalation approach

The use/mention fixture. This document *talks about* escalation at length without defining the four
tiers, so the tests can assert that `escalation.tier-model-documented` still fires.

The failure this guards against is a detector that matches on the topic rather than the content. A
document containing "escalation", "tier", and "normal variation" looks, to a careless check, exactly
like a document that defines a model.

We take escalation seriously. Our approach recognises that some observations represent normal
variation and others do not, and our clinicians decide case by case which is which. We consider
several levels of concern and escalate where warranted, which we believe is more flexible than a
fixed model.

That paragraph is what Standard 3 R6 exists to reject. Escalation decisions made case by case, with
nothing written down for them to be checked against, drift with mood — the same finding reads as
reassuring on a confident day and alarming on a cautious one.

Three of the four canonical labels are deliberately absent from this file. Naming them here, even to
say they are missing, would satisfy the detector's substring scan and destroy the fixture — which is
itself a fair description of what that check can and cannot establish.
